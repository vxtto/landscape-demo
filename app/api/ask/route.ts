import type { NextRequest } from "next/server";

import type { AskExchange, AskStreamEvent } from "@/lib/ask-ai-types";
import {
  contentDeltas,
  streamAnswer,
  triageQuestion,
} from "@/lib/server/ask-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY_EXCHANGES = 3;
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
  let history: AskExchange[] = [];
  try {
    const body = await request.json();
    question = String(body.question ?? "").trim();
    if (Array.isArray(body.history)) {
      history = body.history
        .slice(-MAX_HISTORY_EXCHANGES)
        .map((exchange: unknown) => {
          const turn = exchange as Partial<AskExchange>;
          return {
            question: String(turn?.question ?? "").slice(0, MAX_QUESTION_LENGTH),
            answer: String(turn?.answer ?? ""),
          };
        })
        .filter((turn: AskExchange) => turn.question && turn.answer);
    }
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
      // The reader goes away whenever a visitor navigates or hits Stop, so
      // every write is guarded and the upstream call is cancelled with it
      // rather than billing tokens nobody will read.
      const upstream = new AbortController();
      let closed = false;
      const onDisconnect = () => {
        closed = true;
        upstream.abort();
      };
      request.signal.addEventListener("abort", onDisconnect);

      const send = (event: AskStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      try {
        const triage = await triageQuestion(question, history, upstream.signal);
        send({
          type: "meta",
          verdict: triage.verdict,
          candidates: triage.candidates,
        });
        const answerStream = await streamAnswer(
          question,
          triage,
          history,
          upstream.signal,
        );
        for await (const delta of contentDeltas(answerStream)) {
          send({ type: "delta", text: delta });
        }
        send({ type: "done" });
      } catch (error) {
        if (!closed) {
          console.error("ask-ai request failed", error);
          send({
            type: "error",
            message: "The AI backend is unavailable right now, try again later",
          });
        }
      } finally {
        request.signal.removeEventListener("abort", onDisconnect);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // reader already gone
          }
        }
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
