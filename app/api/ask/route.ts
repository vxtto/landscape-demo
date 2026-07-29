import type { NextRequest } from "next/server";

import type { AskStreamEvent } from "@/lib/ask-ai-types";
import {
  contentDeltas,
  streamAnswer,
  triageQuestion,
} from "@/lib/server/ask-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many questions, try again in a few minutes" },
      { status: 429 },
    );
  }

  let question: string;
  try {
    const body = await request.json();
    question = String(body.question ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      { error: `Question must be 1-${MAX_QUESTION_LENGTH} characters` },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AskStreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const triage = await triageQuestion(question);
        send({
          type: "meta",
          verdict: triage.verdict,
          candidates: triage.candidates,
        });
        const answerStream = await streamAnswer(question, triage);
        for await (const delta of contentDeltas(answerStream)) {
          send({ type: "delta", text: delta });
        }
        send({ type: "done" });
      } catch (error) {
        console.error("ask-ai request failed", error);
        send({
          type: "error",
          message: "The AI backend is unavailable right now, try again later",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
