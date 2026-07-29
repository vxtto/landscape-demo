import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import type { AskCandidate, AskExchange, AskVerdict } from "@/lib/ask-ai-types";

const BASE_URL = (
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"
).replace(/\/$/, "");
const MODEL = process.env.ASK_AI_MODEL ?? "z-ai/glm-5.2";
const MAX_CANDIDATES = 3;
const MAX_ANSWER_TOKENS = 1200;
const MAX_HISTORY_ANSWER_CHARS = 600;

export type CapabilityCard = {
  repo_name: string;
  description: string;
  stars: number | null;
  language: string | null;
  categories: string[];
  openrank: number | null;
  card: {
    summary: string;
    capabilities: string[];
    not_capabilities: string[];
    keywords: string[];
  };
  readme_excerpt: string;
};

export type TriageResult = {
  verdict: AskVerdict;
  candidates: AskCandidate[];
};

let cardsCache: CapabilityCard[] | null = null;

export function getCapabilityCards(): CapabilityCard[] {
  if (!cardsCache) {
    const cardsPath = path.join(process.cwd(), "data", "capability-cards.json");
    cardsCache = JSON.parse(readFileSync(cardsPath, "utf8")) as CapabilityCard[];
  }
  return cardsCache;
}

function apiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return key;
}

async function chatCompletion(
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, ...body }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }
  return response;
}

// The catalog is a stable prompt prefix across every question, so OpenRouter's
// prompt caching applies as long as it stays byte-identical between requests.
let catalogCache: string | null = null;

function buildCatalog(): string {
  if (!catalogCache) {
    catalogCache = getCapabilityCards()
      .map((entry) => {
        const card = entry.card;
        const parts = [
          `${entry.repo_name} [${entry.categories.join(", ")}]`,
          card.summary,
          `does: ${card.capabilities.join("; ")}`,
        ];
        if (card.not_capabilities.length > 0) {
          parts.push(`does NOT: ${card.not_capabilities.join("; ")}`);
        }
        parts.push(`keywords: ${card.keywords.join(", ")}`);
        return parts.join(" | ");
      })
      .join("\n");
  }
  return catalogCache;
}

const TRIAGE_SYSTEM = `You triage questions about an open-source agentic-AI landscape.
Below is the full catalog, one project per line:
repo [categories] | summary | does: ... | does NOT: ... | keywords: ...

Given a user question, decide which projects are relevant and whether the landscape
actually contains what the user is asking for. Answer with strict JSON only:

{
  "verdict": "exact_match" | "closest_only" | "not_in_landscape",
  "candidates": [{"repo": "<repo from the catalog>", "reason": "<=15 words"}]
}

Rules:
- "exact_match": at least one project directly does what is asked.
- "closest_only": nothing does exactly this, but some projects come close or solve part of it.
- "not_in_landscape": nothing is meaningfully related; candidates may be empty.
- List at most ${MAX_CANDIDATES} candidates, most relevant first, repos verbatim from the catalog.
- If earlier turns are shown, resolve references like "it" or "that one" against them.
- Do not invent repos. Output only the JSON object.`;

/**
 * Prior turns go in the user message, never the system message, so the
 * catalog prefix stays byte-identical and remains cacheable upstream.
 */
function withHistory(question: string, history: AskExchange[]): string {
  if (history.length === 0) return `Question: ${question}`;
  const transcript = history
    .map(
      (exchange) =>
        `Q: ${exchange.question}\nA: ${exchange.answer.slice(0, MAX_HISTORY_ANSWER_CHARS)}`,
    )
    .join("\n\n");
  return `Earlier in this conversation:\n${transcript}\n\nCurrent question: ${question}`;
}

/**
 * Pull the triage object out of a raw completion. Reasoning models emit
 * <think> blocks and some models wrap or trail the object with prose, so
 * scanning for the first brace-balanced slice that parses is safer than
 * slicing between the outermost braces.
 */
function extractJsonObject(content: string): unknown {
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "");

  for (
    let start = cleaned.indexOf("{");
    start !== -1;
    start = cleaned.indexOf("{", start + 1)
  ) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < cleaned.length; index += 1) {
      const character = cleaned[index];
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = !inString;
      } else if (!inString && character === "{") {
        depth += 1;
      } else if (!inString && character === "}") {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(cleaned.slice(start, index + 1));
          } catch {
            break;
          }
        }
      }
    }
  }
  throw new Error("Triage returned no parsable JSON");
}

export async function triageQuestion(
  question: string,
  history: AskExchange[] = [],
  signal?: AbortSignal,
): Promise<TriageResult> {
  const response = await chatCompletion(
    {
      messages: [
        { role: "system", content: `${TRIAGE_SYSTEM}\n\nCATALOG:\n${buildCatalog()}` },
        { role: "user", content: withHistory(question, history) },
      ],
      temperature: 0.1,
      max_tokens: 600,
      // Reasoning models otherwise spend the whole budget thinking and
      // return a null content, and chain-of-thought buys nothing when the
      // task is picking repos out of a catalog.
      reasoning: { enabled: false },
    },
    signal,
  );
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const content: string = message?.content || message?.reasoning || "";
  const parsed = extractJsonObject(content) as TriageResult;

  const known = new Map(
    getCapabilityCards().map((entry) => [entry.repo_name.toLowerCase(), entry.repo_name]),
  );
  // Models repeat themselves, and a repeated repo would collide as a React
  // key and read as two separate recommendations.
  const seen = new Set<string>();
  const candidates = (parsed.candidates ?? [])
    .flatMap((candidate) => {
      const repo = known.get(String(candidate.repo).toLowerCase());
      if (!repo || seen.has(repo)) return [];
      seen.add(repo);
      return [{ repo, reason: String(candidate.reason ?? "") }];
    })
    .slice(0, MAX_CANDIDATES);

  const verdict: AskVerdict = ["exact_match", "closest_only", "not_in_landscape"].includes(
    parsed.verdict,
  )
    ? parsed.verdict
    : candidates.length > 0
      ? "closest_only"
      : "not_in_landscape";

  return { verdict, candidates };
}

const ANSWER_SYSTEM = `You answer questions about an open-source agentic-AI landscape.
A triage step already selected candidate projects and a verdict on whether the landscape
contains what the user asked for. You are given each candidate's capability card and README excerpt.

Write a concise, factual answer in markdown (no top-level heading):
- Open with a direct one-sentence answer to the question.
- If the verdict is "not_in_landscape" or "closest_only", say plainly that no project in the
  landscape does exactly this before describing the closest options.
- Ground every claim in the provided material; if the material does not say, say so.
- Refer to projects by their repo name, e.g. **langgenius/dify**.
- If earlier turns are shown, treat the current question as a follow-up to them.
- Keep it under ~250 words.`;

export async function streamAnswer(
  question: string,
  triage: TriageResult,
  history: AskExchange[] = [],
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const cards = getCapabilityCards();
  const sections = triage.candidates.map((candidate) => {
    const entry = cards.find((card) => card.repo_name === candidate.repo);
    if (!entry) return `## ${candidate.repo}\n(no data)`;
    return [
      `## ${entry.repo_name}`,
      `Categories: ${entry.categories.join(", ")} | Stars: ${entry.stars ?? "?"} | OpenRank: ${entry.openrank ?? "?"}`,
      `Summary: ${entry.card.summary}`,
      `Capabilities: ${entry.card.capabilities.join("; ")}`,
      entry.card.not_capabilities.length > 0
        ? `Not capabilities: ${entry.card.not_capabilities.join("; ")}`
        : "",
      `README excerpt:\n${entry.readme_excerpt}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const context =
    sections.length > 0
      ? `Verdict: ${triage.verdict}\n\n${sections.join("\n\n---\n\n")}`
      : `Verdict: ${triage.verdict}\n\nNo candidate projects were found in the landscape.`;

  const response = await chatCompletion(
    {
      messages: [
        { role: "system", content: ANSWER_SYSTEM },
        { role: "user", content: `${context}\n\n${withHistory(question, history)}` },
      ],
      temperature: 0.3,
      max_tokens: MAX_ANSWER_TOKENS,
      stream: true,
      // Thinking would stream as reasoning deltas the panel never renders,
      // leaving the reader watching nothing until the budget is spent.
      reasoning: { enabled: false },
    },
    signal,
  );
  if (!response.body) {
    throw new Error("LLM response has no body");
  }
  return response.body;
}

/**
 * Parse an OpenAI-style SSE stream body and yield content deltas.
 */
export async function* contentDeltas(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const chunk = JSON.parse(payload);
          const delta: string | undefined = chunk.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // ignore malformed keep-alive lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
