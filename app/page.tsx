import { ArrowDownIcon, ArrowUpRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLandscapeProjects } from "@/lib/landscape-data";

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
  const categoryCount = new Set(
    projects.flatMap((project) => project.categories),
  ).size;
  const stageCounts = {
    application: projects.filter(
      (project) => project.stage === "application",
    ).length,
    framework: projects.filter((project) => project.stage === "framework")
      .length,
    runtime: projects.filter((project) => project.stage === "runtime").length,
  };
  const compactNumber = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const metrics = [
    {
      label: "Mapped projects",
      value: projects.length.toLocaleString(),
      note: "Curated across 3 layers",
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
    {
      label: "Category signals",
      value: categoryCount.toLocaleString(),
      note: "Multi-label taxonomy",
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.appShell}>
        <header className={styles.siteHeader}>
          <a className={styles.brand} href="#" aria-label="Agent Atlas home">
            <span aria-hidden="true">A∕A</span>
            <strong>Agent Atlas</strong>
          </a>
          <nav className={styles.headerNav} aria-label="Primary navigation">
            <a href="#overview">Overview</a>
            <a href="#explore">Landscape</a>
            <a
              href="https://github.com/antgroup/agentic-ai-landscape"
              target="_blank"
              rel="noreferrer"
            >
              Data source
              <ArrowUpRightIcon aria-hidden="true" />
            </a>
          </nav>
        </header>

        <section className={styles.hero} id="overview">
          <div className={styles.heroCopy}>
            <Badge variant="secondary">Data snapshot · Apr 2026</Badge>
            <h1>
              Agent infrastructure,
              <br />
              mapped as <em>signals.</em>
            </h1>
            <p>
              A living view of the products, frameworks, and runtime systems
              shaping how AI agents delegate, orchestrate, and act.
            </p>
            <a className={styles.heroAction} href="#explore">
              Explore the landscape
              <ArrowDownIcon aria-hidden="true" />
            </a>
          </div>

          <div className={styles.executionStack}>
            <div className={styles.stackIntro}>
              <span>Execution path</span>
              <strong>Three layers, one system</strong>
            </div>
            <ol>
              <li data-stage="application">
                <span>01</span>
                <div>
                  <strong>Delegate</strong>
                  <small>Agent applications</small>
                </div>
                <i>{stageCounts.application}</i>
              </li>
              <li data-stage="framework">
                <span>02</span>
                <div>
                  <strong>Orchestrate</strong>
                  <small>Agent frameworks</small>
                </div>
                <i>{stageCounts.framework}</i>
              </li>
              <li data-stage="runtime">
                <span>03</span>
                <div>
                  <strong>Execute</strong>
                  <small>Runtime infrastructure</small>
                </div>
                <i>{stageCounts.runtime}</i>
              </li>
            </ol>
          </div>
        </section>

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

        <LandscapeExplorer projects={projects} />

        <footer className={styles.footer}>
          <div>
            <span>A∕A</span>
            <p>
              Agent Atlas — a dynamic reading of the Agent Infra Landscape
              2026.
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
