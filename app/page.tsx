import { getLandscapeProjects } from "@/lib/landscape-data";

import LandscapeExplorer from "./components/landscape-explorer";
import styles from "./page.module.css";

export default function Home() {
  const projects = getLandscapeProjects();
  const totalStars = projects.reduce((sum, project) => sum + project.stars, 0);
  const categoryCount = new Set(projects.flatMap((project) => project.categories)).size;
  const compactNumber = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <main className={styles.page}>
      <header className={styles.siteHeader}>
        <a className={styles.brand} href="#" aria-label="Agent Atlas home">
          <span aria-hidden="true">A∕A</span>
          <strong>Agent Atlas</strong>
        </a>
        <div className={styles.headerMeta}>
          <span>Data snapshot · Apr 2026</span>
          <a
            href="https://github.com/antgroup/agentic-ai-landscape"
            target="_blank"
            rel="noreferrer"
          >
            Source repository <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Agent Infra Landscape / interactive study</span>
          <h1>
            Agent infra,
            <br />
            <em>in motion.</em>
          </h1>
          <p>
            A static ecosystem map becomes a living interface: trace the path from the
            products people touch to the frameworks and runtime systems that let agents act.
          </p>
          <a className={styles.heroAction} href="#explore">
            Enter the landscape
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className={styles.heroDiagram} aria-label="Agent infrastructure execution flow">
          <span className={styles.orbit} aria-hidden="true" />
          <div className={styles.heroNode}>
            <span>01</span>
            <strong>Delegate</strong>
            <small>Application</small>
          </div>
          <div className={styles.heroNode}>
            <span>02</span>
            <strong>Orchestrate</strong>
            <small>Framework</small>
          </div>
          <div className={styles.heroNode}>
            <span>03</span>
            <strong>Execute</strong>
            <small>Runtime</small>
          </div>
        </div>

        <dl className={styles.heroStats}>
          <div>
            <dt>Mapped projects</dt>
            <dd>{projects.length}</dd>
          </div>
          <div>
            <dt>Category signals</dt>
            <dd>{categoryCount}</dd>
          </div>
          <div>
            <dt>Combined stars</dt>
            <dd>{compactNumber.format(totalStars)}</dd>
          </div>
        </dl>
      </section>

      <LandscapeExplorer projects={projects} />

      <footer className={styles.footer}>
        <div>
          <span>A∕A</span>
          <p>Agent Atlas — a dynamic reading of the Agent Infra Landscape 2026.</p>
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
    </main>
  );
}
