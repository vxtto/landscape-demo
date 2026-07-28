"use client";

import { SparklesIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import styles from "../page.module.css";

const STORAGE_KEY = "landscape-welcome-tour-v1";

type TourStep = {
  anchor: string | null;
  title: string;
  body: string;
};

const STEPS: TourStep[] = [
  {
    anchor: "hero",
    title: "A map for a world that won't hold still",
    body: "Projects rise and vanish in weeks, not years. This isn't a snapshot — it's a living map that updates as the ecosystem moves.",
  },
  {
    anchor: "stages",
    title: "Three layers, one stack",
    body: "Where people delegate work, how agents get assembled, and what they need to run reliably. This architecture organizes everything below it.",
  },
  {
    anchor: "project",
    title: "Every logo opens a story",
    body: "Take this one — click any project to see who's building it, its OpenRank trend, and the contributors driving it forward right now.",
  },
  {
    anchor: null,
    title: "Open source is the point",
    body: "Intelligence shouldn't be a privilege for the few. Everything here is open — the projects, the data, the map itself — so more people can see, use, and shape the agent ecosystem together.",
  },
];

type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function measureElement(element: Element): AnchorRect {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export default function WelcomeTour() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const exampleProjectRef = useRef<Element | null>(null);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const timer = window.setTimeout(() => setStep(0), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "done");
    setStep(null);
  }, []);

  useEffect(() => {
    if (step === null) return;

    const anchor = STEPS[step].anchor;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const behavior = reducedMotion ? ("auto" as const) : ("smooth" as const);

    if (anchor === null) {
      window.scrollTo({ top: 0, behavior });
      return;
    }

    let element: Element | null;
    if (anchor === "project") {
      // The example project is picked at random, once per tour run.
      if (!exampleProjectRef.current) {
        const candidates = document.querySelectorAll("[data-tour-candidate]");
        exampleProjectRef.current =
          candidates[Math.floor(Math.random() * candidates.length)] ?? null;
      }
      element = exampleProjectRef.current;
    } else {
      element = document.querySelector(`[data-tour="${anchor}"]`);
    }
    if (!element) return;

    element.scrollIntoView({ block: "center", inline: "center", behavior });

    const target = element;
    const track = () => {
      setRect(measureElement(target));
      frame = window.requestAnimationFrame(track);
    };
    let frame = window.requestAnimationFrame(track);

    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    if (step === null) return;
    cloudRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (step === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, dismiss]);

  if (step === null) return null;

  const current = STEPS[step];
  const centered = current.anchor === null;
  if (!centered && !rect) return null;

  const isLast = step === STEPS.length - 1;
  const cloudStyle =
    centered || !rect
      ? undefined
      : {
          top: Math.min(rect.top + rect.height + 18, window.innerHeight - 230),
          left: Math.max(
            18,
            Math.min(
              rect.left + rect.width / 2 - 190,
              window.innerWidth - 398,
            ),
          ),
        };

  return (
    <div className={styles.tourLayer} role="presentation">
      {centered ? (
        <div className={styles.tourVeil} aria-hidden="true" />
      ) : rect ? (
        <div
          className={styles.tourHighlight}
          style={{
            top: rect.top - 10,
            left: rect.left - 10,
            width: rect.width + 20,
            height: rect.height + 20,
          }}
          aria-hidden="true"
        />
      ) : null}
      <div
        ref={cloudRef}
        className={cn(styles.tourCloud, centered && styles.tourCloudCentered)}
        style={cloudStyle}
        role="dialog"
        aria-modal="false"
        aria-label={`Welcome walkthrough, step ${step + 1} of ${STEPS.length}`}
        tabIndex={-1}
      >
        <header>
          <span className={styles.tourStepBadge}>
            <SparklesIcon aria-hidden="true" />
            {step + 1} / {STEPS.length}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            onClick={dismiss}
            aria-label="Skip walkthrough"
          >
            <XIcon />
          </Button>
        </header>
        <strong>{current.title}</strong>
        <p>{current.body}</p>
        <footer>
          <span className={styles.tourDots} aria-hidden="true">
            {STEPS.map((tourStep, index) => (
              <i
                key={tourStep.anchor}
                className={cn(index === step && styles.tourDotActive)}
              />
            ))}
          </span>
          <span className={styles.tourActions}>
            {step > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            ) : null}
            <Button
              size="sm"
              type="button"
              onClick={() => (isLast ? dismiss() : setStep(step + 1))}
            >
              {isLast ? "Explore the landscape" : "Next"}
            </Button>
          </span>
        </footer>
      </div>
    </div>
  );
}
