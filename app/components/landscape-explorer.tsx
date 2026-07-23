"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { LandscapeProject, StageId } from "@/lib/landscape-types";
import styles from "../page.module.css";

type Metric = "stars" | "openrank";
type StageFilter = "all" | StageId;

const STAGES: Array<{
  id: StageId;
  index: string;
  title: string;
  shortTitle: string;
  summary: string;
}> = [
  {
    id: "application",
    index: "01",
    title: "Agent Application",
    shortTitle: "Applications",
    summary: "The surfaces where people delegate work: coding agents, personal assistants, and chat workspaces.",
  },
  {
    id: "framework",
    index: "02",
    title: "Agent Framework",
    shortTitle: "Frameworks",
    summary: "The orchestration layer for assembling agents, workflows, teams, and production interfaces.",
  },
  {
    id: "runtime",
    index: "03",
    title: "Agent Runtime Infra",
    shortTitle: "Runtime",
    summary: "The execution substrate: context, protocols, tools, observability, gateways, and sandboxes.",
  },
];

const NUMBER_FORMAT = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatMetric(project: LandscapeProject, metric: Metric) {
  if (metric === "openrank") {
    return project.openrank === null
      ? "—"
      : project.openrank.toLocaleString("en", { maximumFractionDigits: 1 });
  }
  return NUMBER_FORMAT.format(project.stars);
}

function Sparkline({ values }: { values: Array<number | null> }) {
  const points = values
    .map((value, index) => ({ value, index }))
    .filter((point): point is { value: number; index: number } => point.value !== null);

  if (points.length < 2) {
    return <div className={styles.sparklineEmpty}>Not enough history</div>;
  }

  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const range = max - min || 1;
  const denominator = Math.max(values.length - 1, 1);
  const line = points
    .map((point) => {
      const x = (point.index / denominator) * 100;
      const y = 40 - ((point.value - min) / range) * 34;
      return `${x},${y}`;
    })
    .join(" ");
  const latest = points.at(-1)!;

  return (
    <svg
      className={styles.sparkline}
      viewBox="0 0 100 44"
      role="img"
      aria-label="12 month OpenRank trend"
    >
      <path d="M0 40H100" className={styles.sparklineBase} />
      <polyline points={line} className={styles.sparklineLine} />
      <circle
        cx={(latest.index / denominator) * 100}
        cy={40 - ((latest.value - min) / range) * 34}
        r="2.7"
        className={styles.sparklineDot}
      />
    </svg>
  );
}

function ProjectCard({
  project,
  metric,
  selected,
  onSelect,
}: {
  project: LandscapeProject;
  metric: Metric;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`${styles.projectCard} ${selected ? styles.projectCardSelected : ""}`}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Open details for ${project.name}`}
    >
      <span className={styles.projectIdentity}>
        <span className={styles.avatarShell}>
          <Image
            src={`https://github.com/${project.owner}.png?size=64`}
            alt=""
            width={32}
            height={32}
            unoptimized
          />
        </span>
        <span className={styles.projectText}>
          <strong>{project.name}</strong>
          <span>{project.owner}</span>
        </span>
      </span>
      <span className={styles.projectMetric}>
        {formatMetric(project, metric)}
        <small>{metric === "stars" ? "stars" : "OpenRank"}</small>
      </span>
    </button>
  );
}

export default function LandscapeExplorer({ projects }: { projects: LandscapeProject[] }) {
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [metric, setMetric] = useState<Metric>("stars");
  const [query, setQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const selectedProject = projects.find((project) => project.repo === selectedRepo) ?? null;
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStage = stageFilter === "all" || project.stage === stageFilter;
      const searchable = [
        project.name,
        project.repo,
        project.description,
        project.language,
        project.zone,
        ...project.categories,
        ...project.topics,
      ]
        .join(" ")
        .toLowerCase();
      return matchesStage && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [projects, query, stageFilter]);

  const visibleStages = STAGES.filter(
    (stage) => stageFilter === "all" || stage.id === stageFilter,
  );

  return (
    <section className={styles.explorer} id="explore" aria-label="Interactive Agent Infra landscape">
      <div className={styles.explorerTopline}>
        <div>
          <span className={styles.eyebrow}>Living landscape / 2026</span>
          <h2>Explore the execution stack</h2>
        </div>
        <p>{filteredProjects.length} projects in view</p>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search projects</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a project, category, or language"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              ×
            </button>
          ) : null}
        </label>

        <div className={styles.filterGroup} aria-label="Filter by layer">
          {[
            ["all", "All layers"],
            ["application", "Applications"],
            ["framework", "Frameworks"],
            ["runtime", "Runtime"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStageFilter(id as StageFilter)}
              aria-pressed={stageFilter === id}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.metricToggle} aria-label="Choose card metric">
          <span>Size by</span>
          <button type="button" onClick={() => setMetric("stars")} aria-pressed={metric === "stars"}>
            Stars
          </button>
          <button
            type="button"
            onClick={() => setMetric("openrank")}
            aria-pressed={metric === "openrank"}
          >
            OpenRank
          </button>
        </div>
      </div>

      <div className={styles.explorerLayout}>
        <nav className={styles.spine} aria-label="Landscape layers">
          <span className={styles.spineRail} aria-hidden="true" />
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setStageFilter(stageFilter === stage.id ? "all" : stage.id)}
              className={stageFilter === stage.id ? styles.spineActive : ""}
              aria-pressed={stageFilter === stage.id}
            >
              <span>{stage.index}</span>
              <strong>{stage.shortTitle}</strong>
            </button>
          ))}
        </nav>

        <div className={styles.mapAndDetail}>
          <div className={styles.map}>
            {visibleStages.map((stage) => {
              const stageProjects = filteredProjects.filter(
                (project) => project.stage === stage.id,
              );
              const zones = [...new Set(stageProjects.map((project) => project.zone))];
              if (!stageProjects.length) return null;

              return (
                <article
                  key={stage.id}
                  className={`${styles.layer} ${styles[`layer_${stage.id}`]}`}
                >
                  <header className={styles.layerHeader}>
                    <span>{stage.index}</span>
                    <div>
                      <h3>{stage.title}</h3>
                      <p>{stage.summary}</p>
                    </div>
                    <strong>{stageProjects.length}</strong>
                  </header>

                  <div className={styles.zoneGrid}>
                    {zones.map((zone) => {
                      const zoneProjects = stageProjects.filter(
                        (project) => project.zone === zone,
                      );
                      return (
                        <section key={zone} className={styles.zone}>
                          <header>
                            <h4>{zone}</h4>
                            <span>{zoneProjects.length}</span>
                          </header>
                          <div className={styles.projectGrid}>
                            {zoneProjects.map((project) => (
                              <ProjectCard
                                key={project.repo}
                                project={project}
                                metric={metric}
                                selected={selectedRepo === project.repo}
                                onSelect={() =>
                                  setSelectedRepo(
                                    selectedRepo === project.repo ? null : project.repo,
                                  )
                                }
                              />
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </article>
              );
            })}

            {!filteredProjects.length ? (
              <div className={styles.emptyState}>
                <span>0 results</span>
                <h3>No project matches “{query}”</h3>
                <p>Try a repository name, category, or programming language.</p>
                <button type="button" onClick={() => setQuery("")}>
                  Clear search
                </button>
              </div>
            ) : null}
          </div>

          <aside className={styles.detailPanel} aria-live="polite">
            {selectedProject ? (
              <>
                <div className={styles.detailIdentity}>
                  <span className={styles.detailAvatar}>
                    <Image
                      src={`https://github.com/${selectedProject.owner}.png?size=128`}
                      alt=""
                      width={56}
                      height={56}
                      unoptimized
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedRepo(null)}
                    aria-label="Close project details"
                  >
                    ×
                  </button>
                </div>
                <span className={styles.detailStage}>{selectedProject.zone}</span>
                <h3>{selectedProject.name}</h3>
                <a
                  className={styles.repoLink}
                  href={`https://github.com/${selectedProject.repo}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selectedProject.repo}
                  <span aria-hidden="true">↗</span>
                </a>
                <p className={styles.detailDescription}>{selectedProject.description}</p>

                <dl className={styles.detailStats}>
                  <div>
                    <dt>Stars</dt>
                    <dd>{NUMBER_FORMAT.format(selectedProject.stars)}</dd>
                  </div>
                  <div>
                    <dt>OpenRank</dt>
                    <dd>
                      {selectedProject.openrank?.toLocaleString("en", {
                        maximumFractionDigits: 1,
                      }) ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Participants</dt>
                    <dd>{NUMBER_FORMAT.format(selectedProject.participants)}</dd>
                  </div>
                  <div>
                    <dt>Language</dt>
                    <dd>{selectedProject.language}</dd>
                  </div>
                </dl>

                <div className={styles.trendBlock}>
                  <div>
                    <span>OpenRank signal</span>
                    <small>May 2025 — Apr 2026</small>
                  </div>
                  <Sparkline values={selectedProject.trend} />
                </div>

                <div className={styles.tagList}>
                  {selectedProject.categories.slice(0, 5).map((category) => (
                    <span key={category}>{category}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.detailPrompt}>
                <span className={styles.detailGlyph} aria-hidden="true">
                  ↗
                </span>
                <span className={styles.eyebrow}>Project signal</span>
                <h3>Pick any project</h3>
                <p>
                  Open its GitHub context, activity signal, category overlap, and twelve-month
                  OpenRank trace.
                </p>
                <div className={styles.detailLegend}>
                  <span>
                    <i /> Applications
                  </span>
                  <span>
                    <i /> Frameworks
                  </span>
                  <span>
                    <i /> Runtime infra
                  </span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
