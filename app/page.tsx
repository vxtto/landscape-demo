import { ArrowUpRightIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLandscapeProjects } from "@/lib/landscape-data";

import AskAi from "./components/ask-ai";
import LandscapeExplorer from "./components/landscape-explorer";
import styles from "./page.module.css";

export default function Home() {
  const projects = getLandscapeProjects();
  const totalStars = projects.reduce(
    (sum, project) => sum + project.stars,
    0,
  );
  const totalOpenRank = projects.reduce(
    (sum, project) => sum + (project.openrank ?? 0),
    0,
  );
  const zoneCount = new Set(projects.map((project) => project.zone)).size;
  const compactNumber = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const metrics = [
    {
      label: "Mapped projects",
      value: projects.length.toLocaleString(),
      note: "Curated across 4 architecture layers",
    },
    {
      label: "Ecosystem zones",
      value: zoneCount.toLocaleString(),
      note: "Stable placement, data-driven contents",
    },
    {
      label: "Combined stars",
      value: compactNumber.format(totalStars),
      note: "GitHub community signal",
    },
    {
      label: "OpenRank signal",
      value: compactNumber.format(totalOpenRank),
      note: "Latest monthly snapshot",
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.appShell}>
        <header className={styles.siteHeader}>
          <a
            className={styles.brand}
            href="#landscape"
            aria-label="Agent Infra Landscape home"
          >
            <span aria-hidden="true">A∕A</span>
            <strong>Agent Infra Landscape</strong>
          </a>
          <nav className={styles.headerNav} aria-label="Primary navigation">
            <a href="#landscape">Landscape</a>
            <a href="#ask-ai">Ask AI</a>
            <a href="#signals">Signals</a>
            <a
              href="https://github.com/antgroup/agentic-ai-landscape"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ArrowUpRightIcon aria-hidden="true" />
            </a>
          </nav>
        </header>

        <LandscapeExplorer projects={projects} />

        <AskAi />

        <section className={styles.metricGrid} aria-label="Landscape summary">
          {metrics.map((metric) => (
            <Card key={metric.label} className={styles.metricCard}>
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle>{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>{metric.note}</CardContent>
            </Card>
          ))}
        </section>

        <footer className={styles.footer}>
          <div>
            <span>A∕A</span>
            <p>
              A living edition of the Agent Infra Landscape 2026 — structure
              first, signals second.
            </p>
          </div>
          <p>
            Data from{" "}
            <a
              href="https://github.com/antgroup/agentic-ai-landscape"
              target="_blank"
              rel="noreferrer"
            >
              antgroup/agentic-ai-landscape
            </a>
            . Multi-label categories overlap by design.
          </p>
        </footer>
      </div>
    </main>
  );
}
