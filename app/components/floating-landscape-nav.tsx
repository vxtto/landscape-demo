"use client";

import { useEffect, useState } from "react";

import styles from "../page.module.css";

const ITEMS = [
  { id: "landscape-home", label: "Home", mark: "H" },
  { id: "agent-infra", label: "Agent Infra", mark: "A" },
  { id: "model-infra", label: "Model Infra", mark: "M" },
  { id: "large-models", label: "Large Models", mark: "L" },
  { id: "awesome-list", label: "Awesome", mark: "W" },
  { id: "signals", label: "Signals", mark: "S" },
  { id: "project-ranking", label: "Ranking", mark: "R" },
] as const;

export default function FloatingLandscapeNav() {
  const [activeId, setActiveId] = useState<string>(ITEMS[0].id);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const marker = window.innerHeight * 0.38;
        let current: string = ITEMS[0].id;

        ITEMS.forEach((item) => {
          const element = document.getElementById(item.id);
          if (element && element.getBoundingClientRect().top <= marker) {
            current = item.id;
          }
        });

        setActiveId(current);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <nav className={styles.floatingNav} aria-label="Landscape sections">
      {ITEMS.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-label={item.label}
          aria-current={activeId === item.id ? "location" : undefined}
        >
          <strong aria-hidden="true">{item.mark}</strong>
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
