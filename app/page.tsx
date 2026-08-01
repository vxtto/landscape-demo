import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

import { getLandscapeProjects } from "@/lib/landscape-data";

import LandscapeLogo from "./components/landscape-logo";
import LandscapeExplorer from "./components/landscape-explorer";
import FloatingLandscapeNav from "./components/floating-landscape-nav";
import styles from "./page.module.css";

export default function Home() {
  const projects = getLandscapeProjects();

  return (
    <main className={styles.page}>
      <FloatingLandscapeNav />
      <div className={styles.appShell}>
        <header className={styles.siteHeader}>
          <a
            className={styles.brand}
            href="#landscape"
            aria-label="Agentic AI Open Source Landscape home"
          >
            <LandscapeLogo className={styles.brandMark} />
            <strong>Agentic AI Landscape</strong>
          </a>
          <nav className={styles.headerNav} aria-label="Primary navigation">
            <Link className={styles.keynoteLink} href="/keynote">
              <span>08.07</span>
              <strong>Keynote</strong>
            </Link>
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
            <LandscapeLogo className={styles.footerMark} />
            <p>
              Open-source projects across Agent Infra, Model Infra, Large
              Models, and reusable agent assets.
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
