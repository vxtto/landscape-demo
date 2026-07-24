"use client";

import Image from "next/image";
import { ArrowUpRightIcon, SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
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
    summary:
      "The surfaces where people delegate work: coding agents, personal assistants, and chat workspaces.",
  },
  {
    id: "framework",
    index: "02",
    title: "Agent Framework",
    shortTitle: "Frameworks",
    summary:
      "The orchestration layer for assembling agents, workflows, teams, and production interfaces.",
  },
  {
    id: "runtime",
    index: "03",
    title: "Agent Runtime Infra",
    shortTitle: "Runtime",
    summary:
      "The execution substrate: context, protocols, tools, observability, gateways, and sandboxes.",
  },
];

const MONTHS = [
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
];

const CHART_CONFIG = {
  application: {
    label: "Applications",
    color: "var(--chart-1)",
  },
  framework: {
    label: "Frameworks",
    color: "var(--chart-2)",
  },
  runtime: {
    label: "Runtime infra",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const NUMBER_FORMAT = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatMetric(project: LandscapeProject, metric: Metric) {
  if (metric === "openrank") {
    return project.openrank === null
      ? "—"
      : project.openrank.toLocaleString("en", {
          maximumFractionDigits: 1,
        });
  }
  return NUMBER_FORMAT.format(project.stars);
}

function Sparkline({ values }: { values: Array<number | null> }) {
  const points = values
    .map((value, index) => ({ value, index }))
    .filter(
      (point): point is { value: number; index: number } =>
        point.value !== null,
    );

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
      className={`${styles.projectCard} ${
        selected ? styles.projectCardSelected : ""
      }`}
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

export default function LandscapeExplorer({
  projects,
}: {
  projects: LandscapeProject[];
}) {
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [metric, setMetric] = useState<Metric>("stars");
  const [query, setQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const selectedProject =
    projects.find((project) => project.repo === selectedRepo) ?? null;

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStage =
        stageFilter === "all" || project.stage === stageFilter;
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
      return (
        matchesStage &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [projects, query, stageFilter]);

  const chartData = useMemo(
    () =>
      MONTHS.map((month, index) => ({
        month,
        application: Math.round(
          projects
            .filter((project) => project.stage === "application")
            .reduce(
              (sum, project) => sum + (project.trend[index] ?? 0),
              0,
            ),
        ),
        framework: Math.round(
          projects
            .filter((project) => project.stage === "framework")
            .reduce(
              (sum, project) => sum + (project.trend[index] ?? 0),
              0,
            ),
        ),
        runtime: Math.round(
          projects
            .filter((project) => project.stage === "runtime")
            .reduce(
              (sum, project) => sum + (project.trend[index] ?? 0),
              0,
            ),
        ),
      })),
    [projects],
  );

  const visibleStages = STAGES.filter(
    (stage) => stageFilter === "all" || stage.id === stageFilter,
  );

  const visibleOpenRank = filteredProjects.reduce(
    (sum, project) => sum + (project.openrank ?? 0),
    0,
  );

  return (
    <section
      className={styles.explorer}
      id="explore"
      aria-label="Interactive Agent Infra landscape"
    >
      <div className={styles.explorerTopline}>
        <div>
          <Badge variant="outline">Living landscape · 2026</Badge>
          <h2>Explore the execution stack</h2>
          <p>
            Filter the ecosystem, compare activity signals, and open any
            project for context.
          </p>
        </div>
        <div className={styles.viewSignal}>
          <span>Projects in view</span>
          <strong>{filteredProjects.length}</strong>
        </div>
      </div>

      <Card className={styles.signalCard}>
        <CardHeader>
          <CardTitle>Ecosystem signal over time</CardTitle>
          <CardDescription>
            Aggregated monthly OpenRank across the three execution layers
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {NUMBER_FORMAT.format(visibleOpenRank)} OpenRank in view
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className={styles.chartLegend} aria-hidden="true">
            {STAGES.map((stage) => (
              <span key={stage.id} data-stage={stage.id}>
                <i />
                {stage.shortTitle}
              </span>
            ))}
          </div>
          <ChartContainer
            config={CHART_CONFIG}
            className={styles.signalChart}
          >
            <BarChart accessibilityLayer data={chartData} barCategoryGap="22%">
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={12}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={46}
                tickFormatter={(value) => NUMBER_FORMAT.format(value)}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.55 }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => (
                      <>
                        <span className={styles.tooltipName}>
                          {CHART_CONFIG[name as keyof typeof CHART_CONFIG]
                            ?.label ?? name}
                        </span>
                        <span className={styles.tooltipValue}>
                          {Number(value).toLocaleString()}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar
                dataKey="application"
                stackId="signal"
                fill="var(--color-application)"
              />
              <Bar
                dataKey="framework"
                stackId="signal"
                fill="var(--color-framework)"
              />
              <Bar
                dataKey="runtime"
                stackId="signal"
                fill="var(--color-runtime)"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <SearchIcon aria-hidden="true" />
          <span className={styles.srOnly}>Search projects</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a project, category, or language"
          />
          {query ? (
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <XIcon />
            </Button>
          ) : null}
        </label>

        <ToggleGroup
          value={[stageFilter]}
          onValueChange={(value) => {
            if (value[0]) setStageFilter(value[0] as StageFilter);
          }}
          variant="outline"
          spacing={0}
          aria-label="Filter by layer"
        >
          <ToggleGroupItem value="all">All layers</ToggleGroupItem>
          <ToggleGroupItem value="application">Applications</ToggleGroupItem>
          <ToggleGroupItem value="framework">Frameworks</ToggleGroupItem>
          <ToggleGroupItem value="runtime">Runtime</ToggleGroupItem>
        </ToggleGroup>

        <div className={styles.metricControl}>
          <span>Project metric</span>
          <ToggleGroup
            value={[metric]}
            onValueChange={(value) => {
              if (value[0]) setMetric(value[0] as Metric);
            }}
            variant="outline"
            spacing={0}
            aria-label="Choose project metric"
          >
            <ToggleGroupItem value="stars">Stars</ToggleGroupItem>
            <ToggleGroupItem value="openrank">OpenRank</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className={styles.explorerLayout}>
        <nav className={styles.spine} aria-label="Landscape layers">
          <span className={styles.spineRail} aria-hidden="true" />
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() =>
                setStageFilter(
                  stageFilter === stage.id ? "all" : stage.id,
                )
              }
              className={
                stageFilter === stage.id ? styles.spineActive : ""
              }
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
              const zones = [
                ...new Set(stageProjects.map((project) => project.zone)),
              ];
              if (!stageProjects.length) return null;

              return (
                <article
                  key={stage.id}
                  className={`${styles.layer} ${
                    styles[`layer_${stage.id}`]
                  }`}
                >
                  <header className={styles.layerHeader}>
                    <div>
                      <span>{stage.index}</span>
                      <Badge variant="secondary">{stage.shortTitle}</Badge>
                    </div>
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
                            <Badge variant="outline">
                              {zoneProjects.length}
                            </Badge>
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
                                    selectedRepo === project.repo
                                      ? null
                                      : project.repo,
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
              <Empty className={styles.emptyState}>
                <EmptyHeader>
                  <EmptyTitle>No project matches “{query}”</EmptyTitle>
                  <EmptyDescription>
                    Try a repository name, category, or programming language.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button type="button" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                </EmptyContent>
              </Empty>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => setSelectedRepo(null)}
                    aria-label="Close project details"
                  >
                    <XIcon />
                  </Button>
                </div>
                <Badge variant="secondary">{selectedProject.zone}</Badge>
                <h3>{selectedProject.name}</h3>
                <a
                  className={styles.repoLink}
                  href={`https://github.com/${selectedProject.repo}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selectedProject.repo}
                  <ArrowUpRightIcon aria-hidden="true" />
                </a>
                <p className={styles.detailDescription}>
                  {selectedProject.description}
                </p>

                <Separator />

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
                    <dd>
                      {NUMBER_FORMAT.format(selectedProject.participants)}
                    </dd>
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
                  {selectedProject.categories
                    .slice(0, 5)
                    .map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                </div>
              </>
            ) : (
              <div className={styles.detailPrompt}>
                <span className={styles.detailGlyph} aria-hidden="true">
                  ↗
                </span>
                <Badge variant="outline">Project signal</Badge>
                <h3>Pick any project</h3>
                <p>
                  Open its GitHub context, activity signal, category overlap,
                  and twelve-month OpenRank trace.
                </p>
                <div className={styles.detailLegend}>
                  <span data-stage="application">
                    <i /> Applications
                  </span>
                  <span data-stage="framework">
                    <i /> Frameworks
                  </span>
                  <span data-stage="runtime">
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
