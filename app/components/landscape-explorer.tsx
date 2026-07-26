"use client";

import Image from "next/image";
import {
  ArrowUpRightIcon,
  GitForkIcon,
  ZoomInIcon,
  ZoomOutIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { LandscapeProject, StageId } from "@/lib/landscape-types";
import { cn } from "@/lib/utils";

import styles from "../page.module.css";

type StageDefinition = {
  id: StageId;
  label: string;
  description: string;
};

const STAGES: StageDefinition[] = [
  {
    id: "application",
    label: "Agent Application",
    description: "Where people delegate work",
  },
  {
    id: "framework",
    label: "Agent Framework",
    description: "How agents are assembled and orchestrated",
  },
  {
    id: "runtime",
    label: "Agent Runtime Infra",
    description: "What agents need to execute reliably",
  },
  {
    id: "model",
    label: "Model Infrastructure",
    description: "From data and training to serving and scheduling",
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
    color: "var(--chart-4)",
  },
  framework: {
    label: "Frameworks",
    color: "var(--chart-1)",
  },
  runtime: {
    label: "Runtime infra",
    color: "var(--chart-2)",
  },
  model: {
    label: "Model infra",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const NUMBER_FORMAT = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function zoneSlug(zone: string) {
  return zone
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

function matchesQuery(project: LandscapeProject, query: string) {
  if (!query) return true;

  return [
    project.name,
    project.repo,
    project.description,
    project.language,
    project.zone,
    ...project.categories,
    ...project.topics,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function formatOpenRank(project: LandscapeProject) {
  return project.openrank?.toLocaleString("en", {
    maximumFractionDigits: 1,
  }) ?? "—";
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

type RankStyle = CSSProperties & {
  "--logo-size": string;
  "--name-size": string;
  "--mark-basis": string;
  "--rank-grow": string;
};

function ProjectMark({
  project,
  rankScale,
  matched,
  selected,
  onSelect,
}: {
  project: LandscapeProject;
  rankScale: number;
  matched: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const stableScale = Number(rankScale.toFixed(6));
  const visualScale = Number(Math.pow(stableScale, 1.15).toFixed(6));
  const style: RankStyle = {
    "--logo-size": `${(22 + visualScale * 42).toFixed(3)}px`,
    "--name-size": `${(9.5 + visualScale * 5.2).toFixed(3)}px`,
    "--mark-basis": `${(76 + visualScale * 70).toFixed(3)}px`,
    "--rank-grow": (0.45 + visualScale * 2.8).toFixed(3),
  };

  return (
    <button
      className={cn(
        styles.projectMark,
        !matched && styles.projectMarkDimmed,
        selected && styles.projectMarkSelected,
      )}
      type="button"
      style={style}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${project.name}, OpenRank ${formatOpenRank(project)}`}
    >
      <span className={styles.projectLogo}>
        <Image
          src={`https://github.com/${project.owner}.png?size=128`}
          alt=""
          width={64}
          height={64}
          unoptimized
        />
      </span>
      <span className={styles.projectName}>{project.name}</span>
      <span className={styles.projectRank}>
        <strong>{formatOpenRank(project)}</strong>
        <small>OpenRank</small>
      </span>
    </button>
  );
}

function projectInitials(project: LandscapeProject) {
  return project.name
    .split(/[\s.-]+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProjectDialog({
  project,
  neighbors,
  onClose,
  onSelect,
}: {
  project: LandscapeProject;
  neighbors: LandscapeProject[];
  onClose: () => void;
  onSelect: (repo: string) => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.projectDialog}>
        <DialogHeader className={styles.dialogHeader}>
          <div className={styles.detailIdentity}>
            <Avatar className={styles.detailAvatar}>
              <AvatarImage
                src={`https://github.com/${project.owner}.png?size=160`}
                alt={`${project.name} logo`}
              />
              <AvatarFallback>{projectInitials(project)}</AvatarFallback>
            </Avatar>
            <div>
              <div className={styles.detailBadges}>
                <Badge variant="secondary">{project.zone}</Badge>
                <Badge variant="outline">{project.stage} layer</Badge>
              </div>
              <DialogTitle className={styles.detailTitle}>
                {project.name}
              </DialogTitle>
              <a
                className={styles.repoLink}
                href={`https://github.com/${project.repo}`}
                target="_blank"
                rel="noreferrer"
              >
                {project.repo}
                <ArrowUpRightIcon aria-hidden="true" />
              </a>
            </div>
          </div>
          <DialogDescription className={styles.detailDescription}>
            {project.description}
          </DialogDescription>
        </DialogHeader>

        <dl className={styles.detailStats}>
          <div>
            <dt>OpenRank</dt>
            <dd>{formatOpenRank(project)}</dd>
          </div>
          <div>
            <dt>Stars</dt>
            <dd>{NUMBER_FORMAT.format(project.stars)}</dd>
          </div>
          <div>
            <dt>Participants</dt>
            <dd>{NUMBER_FORMAT.format(project.participants)}</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>{project.language}</dd>
          </div>
        </dl>

        <div className={styles.dialogWorkspace}>
          <section className={styles.trendBlock}>
            <div>
              <span>OpenRank signal</span>
              <small>May 2025 — Apr 2026</small>
            </div>
            <Sparkline values={project.trend} />
          </section>

          <section className={styles.categoryBlock}>
            <header>
              <span>Taxonomy signals</span>
              <small>{project.categories.length} categories</small>
            </header>
            <div>
              {project.categories.slice(0, 7).map((category) => (
                <Badge key={category} variant="outline">
                  {category}
                </Badge>
              ))}
            </div>
          </section>

          <section className={styles.neighborBlock}>
            <header>
              <span>Same ecosystem zone</span>
              <small>Switch context without closing</small>
            </header>
            <div>
              {neighbors.slice(0, 6).map((neighbor) => (
                <button
                  key={neighbor.repo}
                  type="button"
                  onClick={() => onSelect(neighbor.repo)}
                  aria-label={`View ${neighbor.name}`}
                >
                  <Avatar size="sm">
                    <AvatarImage
                      src={`https://github.com/${neighbor.owner}.png?size=64`}
                      alt=""
                    />
                    <AvatarFallback>
                      {projectInitials(neighbor)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{neighbor.name}</span>
                  <small>{formatOpenRank(neighbor)}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StageSection({
  stage,
  projects,
  normalizedQuery,
  selectedRepo,
  rankScale,
  onSelect,
}: {
  stage: StageDefinition;
  projects: LandscapeProject[];
  normalizedQuery: string;
  selectedRepo: string | null;
  rankScale: (project: LandscapeProject) => number;
  onSelect: (repo: string) => void;
}) {
  const stageProjects = projects.filter(
    (project) => project.stage === stage.id,
  );
  const zones = [...new Set(stageProjects.map((project) => project.zone))];

  return (
    <article className={cn(styles.stage, styles[`stage_${stage.id}`])}>
      <header className={styles.stageLabel}>
        <h3>{stage.label}</h3>
        <span>{stage.description}</span>
      </header>

      <div
        className={cn(styles.stageGrid, styles[`stageGrid_${stage.id}`])}
      >
        {zones.map((zone) => {
          const zoneProjects = stageProjects
            .filter((project) => project.zone === zone)
            .sort(
              (a, b) =>
                (b.openrank ?? -1) - (a.openrank ?? -1) ||
                a.name.localeCompare(b.name),
            );

          return (
            <section
              key={zone}
              className={cn(
                styles.zone,
                styles[`zone_${zoneSlug(zone)}`],
              )}
            >
              <header className={styles.zoneHeader}>
                <span aria-hidden="true" />
                <h4>
                  <Badge
                    className={styles.zoneTitleBadge}
                    variant="outline"
                  >
                    {zone}
                  </Badge>
                </h4>
                <Badge
                  className={styles.zoneCountBadge}
                  variant="secondary"
                >
                  {zoneProjects.length}
                </Badge>
                <span aria-hidden="true" />
              </header>
              <div className={styles.projectCloud}>
                {zoneProjects.map((zoneProject) => (
                  <ProjectMark
                    key={zoneProject.repo}
                    project={zoneProject}
                    rankScale={rankScale(zoneProject)}
                    matched={matchesQuery(zoneProject, normalizedQuery)}
                    selected={selectedRepo === zoneProject.repo}
                    onSelect={() => onSelect(zoneProject.repo)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}

export default function LandscapeExplorer({
  projects,
}: {
  projects: LandscapeProject[];
}) {
  const [query, setQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [zoom, setZoom] = useState(90);
  const normalizedQuery = query.trim().toLowerCase();

  const selectedProject =
    projects.find((project) => project.repo === selectedRepo) ?? null;
  const selectedNeighbors = selectedProject
    ? projects
        .filter(
          (project) =>
            project.zone === selectedProject.zone &&
            project.repo !== selectedProject.repo,
        )
        .sort(
          (a, b) =>
            (b.openrank ?? -1) - (a.openrank ?? -1) ||
            a.name.localeCompare(b.name),
        )
    : [];

  const openRankRange = useMemo(() => {
    const values = projects
      .map((project) => project.openrank)
      .filter((value): value is number => value !== null && value > 0)
      .map((value) => Math.log1p(value));
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [projects]);

  const rankScale = (project: LandscapeProject) => {
    if (!project.openrank) return 0;
    const value = Math.log1p(project.openrank);
    const range = openRankRange.max - openRankRange.min || 1;
    return Math.max(0, Math.min(1, (value - openRankRange.min) / range));
  };

  const matchCount = useMemo(
    () =>
      projects.filter((project) => matchesQuery(project, normalizedQuery))
        .length,
    [normalizedQuery, projects],
  );

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
        model: Math.round(
          projects
            .filter((project) => project.stage === "model")
            .reduce(
              (sum, project) => sum + (project.trend[index] ?? 0),
              0,
            ),
        ),
      })),
    [projects],
  );

  const totalOpenRank = projects.reduce(
    (sum, project) => sum + (project.openrank ?? 0),
    0,
  );

  return (
    <section
      className={styles.explorer}
      id="landscape"
      aria-label="Interactive Agent Infra landscape"
    >
      <div className={styles.landscapeLead}>
        <div>
          <Badge variant="secondary">Living landscape · Apr 2026</Badge>
          <h1>See the ecosystem before the metrics.</h1>
          <p>
            The original architecture stays visible while live project signals
            decide the order and visual weight inside each ecosystem zone.
          </p>
        </div>
        <div className={styles.rankRule}>
          <span className={styles.rankRuleExample} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            Higher OpenRank
            <strong>earlier · larger</strong>
          </span>
        </div>
      </div>

      <div className={styles.boardToolbar}>
        <label className={styles.search}>
          <SearchIcon aria-hidden="true" />
          <span className={styles.srOnly}>Search projects</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a project, category, or language"
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
        <div className={styles.searchStatus} aria-live="polite">
          {normalizedQuery ? (
            <>
              <strong>{matchCount}</strong> matches highlighted
            </>
          ) : (
            <>
              <strong>{projects.length}</strong> projects mapped
            </>
          )}
        </div>
        <div className={styles.zoomControl} aria-label="Landscape zoom">
          <Button
            variant="outline"
            size="icon-sm"
            type="button"
            onClick={() => setZoom((value) => Math.max(70, value - 10))}
            disabled={zoom === 70}
            aria-label="Zoom out"
          >
            <ZoomOutIcon />
          </Button>
          <span>{zoom}%</span>
          <Button
            variant="outline"
            size="icon-sm"
            type="button"
            onClick={() => setZoom((value) => Math.min(110, value + 10))}
            disabled={zoom === 110}
            aria-label="Zoom in"
          >
            <ZoomInIcon />
          </Button>
        </div>
        <span className={styles.scrollHint}>Scroll sideways to inspect →</span>
      </div>

      <div className={styles.boardViewport}>
        <div
          className={styles.landscapeBoard}
          style={{ zoom: zoom / 100 }}
        >
          <section className={styles.landscapeSlide}>
            <header className={styles.boardMasthead}>
              <div className={styles.boardTitleLockup}>
                <span aria-hidden="true">A∕A</span>
                <div>
                  <h2>Agent Infra Landscape 2026</h2>
                  <p>Interactive ecosystem map · sorted by OpenRank</p>
                </div>
              </div>
              <div className={styles.boardSource}>
                <strong>ANT OPEN SOURCE</strong>
                <span>
                  {
                    projects.filter((project) => project.stage !== "model")
                      .length
                  }{" "}
                  projects · OpenRank weighted
                </span>
              </div>
            </header>

            <div className={styles.landscapeBand}>
              <aside className={styles.infraRail} aria-hidden="true">
                <span>Agent Infra</span>
              </aside>
              <div
                className={cn(
                  styles.stageStack,
                  styles.agentStageStack,
                )}
              >
                {STAGES.filter((stage) => stage.id !== "model").map((stage) => (
                  <StageSection
                    key={stage.id}
                    stage={stage}
                    projects={projects}
                    normalizedQuery={normalizedQuery}
                    selectedRepo={selectedRepo}
                    rankScale={rankScale}
                    onSelect={setSelectedRepo}
                  />
                ))}
              </div>
            </div>
          </section>

          <section
            className={cn(
              styles.landscapeSlide,
              styles.modelLandscapeSlide,
            )}
          >
            <header className={styles.boardMasthead}>
              <div className={styles.boardTitleLockup}>
                <span aria-hidden="true">M∕I</span>
                <div>
                  <h2>Model Infra Landscape 2026</h2>
                  <p>Interactive ecosystem map · sorted by OpenRank</p>
                </div>
              </div>
              <div className={styles.boardSource}>
                <strong>ANT OPEN SOURCE</strong>
                <span>
                  {
                    projects.filter((project) => project.stage === "model")
                      .length
                  }{" "}
                  projects · OpenRank weighted
                </span>
              </div>
            </header>

            <div className={styles.landscapeBand}>
              <aside
                className={cn(styles.infraRail, styles.modelInfraRail)}
                aria-hidden="true"
              >
                <span>Model Infra</span>
              </aside>
              <div className={styles.stageStack}>
                {STAGES.filter((stage) => stage.id === "model").map((stage) => (
                  <StageSection
                    key={stage.id}
                    stage={stage}
                    projects={projects}
                    normalizedQuery={normalizedQuery}
                    selectedRepo={selectedRepo}
                    rankScale={rankScale}
                    onSelect={setSelectedRepo}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <p className={styles.boardCaption}>
        Each landscape is composed as an independent 16:9 canvas. Ecosystem
        placement follows the repository taxonomy; OpenRank uses a logarithmic
        scale so leaders stand out without hiding emerging projects. Select any
        logo for project context.
      </p>

      {selectedProject ? (
        <ProjectDialog
          project={selectedProject}
          neighbors={selectedNeighbors}
          onClose={() => setSelectedRepo(null)}
          onSelect={setSelectedRepo}
        />
      ) : null}

      <Separator className={styles.sectionSeparator} />

      <section className={styles.signals} id="signals">
        <div className={styles.signalsIntro}>
          <div>
            <Badge variant="outline">Signal layer</Badge>
            <h2>The structure stays familiar. The data keeps moving.</h2>
          </div>
          <p>
            The map above answers “where does it belong?” This view answers
            “how is each layer moving?”
          </p>
        </div>

        <Card className={styles.signalCard}>
          <CardHeader>
            <CardTitle>Ecosystem signal over time</CardTitle>
            <CardDescription>
              Aggregated monthly OpenRank across the four architecture layers
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {NUMBER_FORMAT.format(totalOpenRank)} OpenRank
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className={styles.chartLegend} aria-hidden="true">
              {STAGES.map((stage) => (
                <span key={stage.id} data-stage={stage.id}>
                  <i />
                  {stage.label}
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
                />
                <Bar
                  dataKey="model"
                  stackId="signal"
                  fill="var(--color-model)"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <a
          className={styles.sourceCallout}
          href="https://github.com/antgroup/agentic-ai-landscape"
          target="_blank"
          rel="noreferrer"
        >
          <GitForkIcon aria-hidden="true" />
          <span>
            <strong>Inspect the source taxonomy</strong>
            <small>antgroup/agentic-ai-landscape</small>
          </span>
          <ArrowUpRightIcon aria-hidden="true" />
        </a>
      </section>
    </section>
  );
}
