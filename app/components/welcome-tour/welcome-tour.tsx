"use client";

import { SparklesIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import styles from "./welcome-tour.module.css";
import { TOUR_STEPS, TOUR_VERSION, type TourStep } from "./tour-steps";

const STORAGE_KEY = `landscape-welcome-tour-v${TOUR_VERSION}`;

const CLOUD_WIDTH = 380;
const CLOUD_GAP = 18;

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

/** An element only counts as an anchor if it actually occupies space. */
function isVisible(element: Element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Walk the step's fallback chain and return the first visible match, or null
 * if the UI it described is gone. Resolved elements are cached per step so a
 * "random" pick stays put for the rest of the run.
 */
function resolveAnchor(step: TourStep, cache: Map<string, Element>) {
  const cached = cache.get(step.id);
  if (cached?.isConnected && isVisible(cached)) return cached;
  cache.delete(step.id);

  for (const selector of step.anchors ?? []) {
    const matches = Array.from(document.querySelectorAll(selector)).filter(
      isVisible,
    );
    if (!matches.length) continue;

    const element =
      step.pick === "random"
        ? matches[Math.floor(Math.random() * matches.length)]
        : matches[0];

    cache.set(step.id, element);
    return element;
  }

  return null;
}

export default function WelcomeTour() {
  const [step, setStep] = useState<number | null>(null);
  // Tagged with the step it was measured for, so a rect can never outlive its
  // step and spotlight the previous element under this step's copy.
  const [tracked, setTracked] = useState<{
    step: number;
    rect: AnchorRect;
  } | null>(null);
  // Which way the reader is travelling, so a skipped step keeps their momentum.
  const directionRef = useRef<1 | -1>(1);
  const anchorCache = useRef(new Map<string, Element>());
  const cloudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TOUR_STEPS.length) return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const timer = window.setTimeout(() => setStep(0), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "done");
    setStep(null);
  }, []);

  const goTo = useCallback(
    (next: number, direction: 1 | -1) => {
      directionRef.current = direction;
      if (next < 0 || next >= TOUR_STEPS.length) {
        dismiss();
        return;
      }
      setStep(next);
    },
    [dismiss],
  );

  useEffect(() => {
    if (step === null) return;

    const current = TOUR_STEPS[step];
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const behavior = reducedMotion ? ("auto" as const) : ("smooth" as const);

    if (!current.anchors?.length) {
      window.scrollTo({ top: 0, behavior });
      return;
    }

    const element = resolveAnchor(current, anchorCache.current);
    if (!element) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[welcome-tour] step "${current.id}" matched none of ` +
            `${JSON.stringify(current.anchors)} — skipping it. ` +
            `Update its anchors in tour-steps.ts.`,
        );
      }
      goTo(step + directionRef.current, directionRef.current);
      return;
    }

    element.scrollIntoView({ block: "center", inline: "center", behavior });

    let frame = 0;
    const track = () => {
      setTracked({ step, rect: measureElement(element) });
      frame = window.requestAnimationFrame(track);
    };
    frame = window.requestAnimationFrame(track);

    return () => window.cancelAnimationFrame(frame);
  }, [step, goTo]);

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

  const current = TOUR_STEPS[step];
  const centered = !current.anchors?.length;
  const rect = tracked?.step === step ? tracked.rect : null;
  if (!centered && !rect) return null;

  const isLast = step === TOUR_STEPS.length - 1;
  const cloudStyle =
    centered || !rect
      ? undefined
      : {
          top: Math.min(
            rect.top + rect.height + CLOUD_GAP,
            window.innerHeight - 230,
          ),
          left: Math.max(
            CLOUD_GAP,
            Math.min(
              rect.left + rect.width / 2 - CLOUD_WIDTH / 2,
              window.innerWidth - CLOUD_WIDTH - CLOUD_GAP,
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
        aria-label={`Welcome walkthrough, step ${step + 1} of ${
          TOUR_STEPS.length
        }`}
        tabIndex={-1}
      >
        <header>
          <span className={styles.tourStepBadge}>
            <SparklesIcon aria-hidden="true" />
            {step + 1} / {TOUR_STEPS.length}
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
            {TOUR_STEPS.map((tourStep, index) => (
              <i
                key={tourStep.id}
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
                onClick={() => goTo(step - 1, -1)}
              >
                Back
              </Button>
            ) : null}
            <Button
              size="sm"
              type="button"
              onClick={() => (isLast ? dismiss() : goTo(step + 1, 1))}
            >
              {isLast ? "Explore the landscape" : "Next"}
            </Button>
          </span>
        </footer>
      </div>
    </div>
  );
}
