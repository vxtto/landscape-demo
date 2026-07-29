import { ArrowUpRightIcon } from "lucide-react";

import { getLandscapeProjects } from "@/lib/landscape-data";

import LandscapeExplorer from "./components/landscape-explorer";
import styles from "./page.module.css";

export default function Home() {
  const projects = getLandscapeProjects();

  return (
    <main className={styles.page}>
      <div className={styles.appShell}>
        <header className={styles.siteHeader}>
          <a
            className={styles.brand}
            href="#landscape"
            aria-label="Agentic AI Open Source Landscape home"
          >
            <span aria-hidden="true">AI</span>
            <strong>Agentic AI Landscape</strong>
          </a>
          <nav className={styles.headerNav} aria-label="Primary navigation">
            <a href="#agent-infra">Agent Infra</a>
            <a href="#model-infra">Model Infra</a>
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

        <footer className={styles.footer}>
          <div>
            <span>AI</span>
            <p>
              A living map of the open-source Agentic AI ecosystem — Agent
              Infra and Model Infra, viewed together.
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
