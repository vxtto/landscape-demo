"use client";

import {
  ArrowUpRightIcon,
  CircleStopIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AskCandidate,
  AskExchange,
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

const HISTORY_EXCHANGES = 3;

type TurnState = "searching" | "answering" | "done" | "error";

type Turn = {
  id: number;
  question: string;
  verdict: AskVerdict | null;
  candidates: AskCandidate[];
  answer: string;
  state: TurnState;
  error: string | null;
};

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
        const isList =
          lines.length > 0 && lines.every((line) => /^\s*[-*]\s+/.test(line));
        if (isList) {
          return (
            <ul key={blockIndex}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {renderInline(line.replace(/^\s*[-*]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }
        return <p key={blockIndex}>{renderInline(block)}</p>;
      })}
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  return (
    <article className={styles.askTurn}>
      <p className={styles.askQuestion}>{turn.question}</p>

      {turn.state === "searching" && (
        <p className={styles.askStatus}>
          <span className={styles.askPulse}>
            Searching the landscape for matching projects…
          </span>
        </p>
      )}

      {turn.verdict && (
        <div className={styles.askMeta}>
          <Badge
            className={cn(styles.askVerdict, styles[`askVerdict_${turn.verdict}`])}
          >
            {VERDICT_LABELS[turn.verdict]}
          </Badge>
          {turn.candidates.map((candidate) => (
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

      {turn.answer && <AnswerText text={turn.answer} />}
      {turn.state === "answering" && !turn.answer && (
        <p className={styles.askStatus}>
          <span className={styles.askPulse}>Writing…</span>
        </p>
      )}
      {turn.error && <p className={styles.askError}>{turn.error}</p>}
    </article>
  );
}

export default function AskAiPanel() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pinnedRef = useRef(true);
  const nextTurnIdRef = useRef(0);

  const activeTurn = turns[turns.length - 1];
  const busy =
    activeTurn?.state === "searching" || activeTurn?.state === "answering";

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Follow the stream only while the reader is already at the bottom, so
  // scrolling up to re-read an earlier answer is not yanked back down.
  useEffect(() => {
    const element = transcriptRef.current;
    if (element && pinnedRef.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [turns]);

  function handleScroll() {
    const element = transcriptRef.current;
    if (!element) return;
    pinnedRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 60;
  }

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const history: AskExchange[] = turns
      .filter((turn) => turn.state === "done" && turn.answer)
      .slice(-HISTORY_EXCHANGES)
      .map((turn) => ({ question: turn.question, answer: turn.answer }));

    const id = (nextTurnIdRef.current += 1);
    setTurns((current) => [
      ...current,
      {
        id,
        question: trimmed,
        verdict: null,
        candidates: [],
        answer: "",
        state: "searching",
        error: null,
      },
    ]);
    setInput("");
    pinnedRef.current = true;

    const patch = (changes: Partial<Turn>) =>
      setTurns((current) =>
        current.map((turn) => (turn.id === id ? { ...turn, ...changes } : turn)),
      );

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history }),
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
            patch({
              verdict: event.verdict,
              candidates: event.candidates,
              state: "answering",
            });
          } else if (event.type === "delta") {
            setTurns((current) =>
              current.map((turn) =>
                turn.id === id ? { ...turn, answer: turn.answer + event.text } : turn,
              ),
            );
          } else if (event.type === "done") {
            patch({ state: "done" });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
      setTurns((current) =>
        current.map((turn) =>
          turn.id === id && turn.state === "answering"
            ? { ...turn, state: "done" }
            : turn,
        ),
      );
    } catch (caught) {
      if (controller.signal.aborted) {
        setTurns((current) =>
          current.map((turn) =>
            turn.id === id
              ? { ...turn, state: turn.answer ? "done" : "error" }
              : turn,
          ),
        );
        return;
      }
      patch({
        state: "error",
        error: caught instanceof Error ? caught.message : "Something went wrong",
      });
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <>
      <button
        type="button"
        className={cn(styles.askLauncher, open && styles.askLauncherHidden)}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="ask-ai-panel"
      >
        <SparklesIcon aria-hidden="true" />
        Ask AI
      </button>

      {open && (
        <div
          className={styles.askScrim}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="ask-ai-panel"
        className={cn(styles.askPanel, open && styles.askPanelOpen)}
        aria-label="Ask the landscape"
        inert={!open}
      >
        <header className={styles.askPanelHeader}>
          <div className={styles.askPanelTitle}>
            <SparklesIcon aria-hidden="true" />
            <strong>Ask the landscape</strong>
          </div>
          <button
            type="button"
            className={styles.askIconButton}
            onClick={() => setOpen(false)}
            aria-label="Close Ask AI panel"
          >
            <XIcon aria-hidden="true" />
          </button>
        </header>

        <div
          className={styles.askTranscript}
          ref={transcriptRef}
          onScroll={handleScroll}
        >
          {turns.length === 0 ? (
            <div className={styles.askEmpty}>
              <p>
                Describe what you are looking for. The assistant searches every
                mapped project, checks whether it actually exists, then answers.
              </p>
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
            </div>
          ) : (
            turns.map((turn) => <TurnView key={turn.id} turn={turn} />)
          )}
        </div>

        <form
          className={styles.askComposer}
          onSubmit={(submitEvent) => {
            submitEvent.preventDefault();
            void ask(input);
          }}
        >
          <textarea
            ref={inputRef}
            className={styles.askTextarea}
            value={input}
            onChange={(changeEvent) => setInput(changeEvent.target.value)}
            onKeyDown={(keyEvent) => {
              if (keyEvent.key === "Enter" && !keyEvent.shiftKey) {
                keyEvent.preventDefault();
                void ask(input);
              }
            }}
            placeholder="Ask about the landscape…"
            maxLength={500}
            rows={2}
            aria-label="Question about the landscape"
          />
          <div className={styles.askComposerActions}>
            <span className={styles.askHint}>Enter to send</span>
            {busy ? (
              <Button type="button" size="sm" variant="outline" onClick={stop}>
                <CircleStopIcon aria-hidden="true" />
                Stop
              </Button>
            ) : (
              <Button type="submit" size="sm" disabled={!input.trim()}>
                <SendIcon aria-hidden="true" />
                Ask
              </Button>
            )}
          </div>
        </form>
      </aside>
    </>
  );
}
