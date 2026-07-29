"use client";

import {
  ArrowUpRightIcon,
  CircleStopIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { Fragment, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AskCandidate,
  AskStreamEvent,
  AskVerdict,
} from "@/lib/ask-ai-types";
import { cn } from "@/lib/utils";

import styles from "../page.module.css";

const VERDICT_LABELS: Record<AskVerdict, string> = {
  exact_match: "Found in landscape",
  closest_only: "Closest matches only",
  not_in_landscape: "Not in landscape",
};

const EXAMPLE_QUESTIONS = [
  "Is there a service that aggregates token usage across all my agents and tools?",
  "What can I use to sandbox agent-generated code?",
  "Which projects help me evaluate agent trajectories?",
];

type AskState = "idle" | "searching" | "answering" | "done" | "error";

/**
 * Minimal markdown rendering for the answer stream: paragraphs, bullet
 * lists, and **bold** spans. Full markdown is intentionally out of scope.
 */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

function AnswerText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className={styles.askAnswer}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim().length > 0);
        const isList = lines.length > 0 && lines.every((line) => /^\s*[-*]\s+/.test(line));
        if (isList) {
          return (
            <ul key={blockIndex}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return <p key={blockIndex}>{renderInline(block)}</p>;
      })}
    </div>
  );
}

export default function AskAi() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<AskState>("idle");
  const [verdict, setVerdict] = useState<AskVerdict | null>(null);
  const [candidates, setCandidates] = useState<AskCandidate[]>([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const busy = state === "searching" || state === "answering";

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setQuestion(trimmed);
    setState("searching");
    setVerdict(null);
    setCandidates([]);
    setAnswer("");
    setError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AskStreamEvent;
          if (event.type === "meta") {
            setVerdict(event.verdict);
            setCandidates(event.candidates);
            setState("answering");
          } else if (event.type === "delta") {
            setAnswer((current) => current + event.text);
          } else if (event.type === "done") {
            setState("done");
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
      setState((current) => (current === "answering" ? "done" : current));
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      setState("error");
    }
  }

  function stop() {
    abortRef.current?.abort();
    setState(answer ? "done" : "idle");
  }

  return (
    <section className={styles.askSection} id="ask-ai" aria-label="Ask AI">
      <Card className={styles.askCard}>
        <CardHeader>
          <CardTitle className={styles.askTitle}>
            <SparklesIcon aria-hidden="true" />
            Ask the landscape
          </CardTitle>
          <CardDescription>
            Describe what you are looking for — the AI searches all mapped
            projects, checks whether it actually exists, then answers.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.askBody}>
          <form
            className={styles.askForm}
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              void ask(question);
            }}
          >
            <Input
              value={question}
              onChange={(changeEvent) => setQuestion(changeEvent.target.value)}
              placeholder="e.g. Is there a gateway that tracks token spend across agents?"
              maxLength={500}
              disabled={busy}
              aria-label="Question about the landscape"
            />
            {busy ? (
              <Button type="button" variant="outline" onClick={stop}>
                <CircleStopIcon aria-hidden="true" />
                Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!question.trim()}>
                <SendIcon aria-hidden="true" />
                Ask
              </Button>
            )}
          </form>

          {state === "idle" && (
            <div className={styles.askExamples}>
              {EXAMPLE_QUESTIONS.map((example) => (
                <button
                  key={example}
                  type="button"
                  className={styles.askExample}
                  onClick={() => void ask(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          )}

          {state === "searching" && (
            <p className={styles.askStatus}>
              Searching {""}
              <span className={styles.askPulse}>
                the landscape for matching projects…
              </span>
            </p>
          )}

          {verdict && (
            <div className={styles.askMeta}>
              <Badge
                className={cn(
                  styles.askVerdict,
                  styles[`askVerdict_${verdict}`],
                )}
              >
                {VERDICT_LABELS[verdict]}
              </Badge>
              {candidates.map((candidate) => (
                <a
                  key={candidate.repo}
                  className={styles.askCandidate}
                  href={`https://github.com/${candidate.repo}`}
                  target="_blank"
                  rel="noreferrer"
                  title={candidate.reason}
                >
                  {candidate.repo}
                  <ArrowUpRightIcon aria-hidden="true" />
                </a>
              ))}
            </div>
          )}

          {answer && <AnswerText text={answer} />}
          {state === "answering" && <p className={styles.askStatus}>Writing…</p>}
          {error && <p className={styles.askError}>{error}</p>}
        </CardContent>
      </Card>
    </section>
  );
}
