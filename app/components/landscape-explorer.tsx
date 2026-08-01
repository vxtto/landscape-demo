"use client";

import {
  ArrowUpRightIcon,
  Maximize2Icon,
  Share2Icon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LandscapeProject, StageId } from "@/lib/landscape-types";
import { projectLogoUrl } from "@/lib/project-logo";
import { cn } from "@/lib/utils";

import styles from "../page.module.css";
import { EcosystemSignals } from "./ecosystem-signals";
import { LandscapeShareDialog } from "./landscape-share-dialog";
import { ProjectInsightDialog } from "./project-insight-dialog";
import { ProjectRanking } from "./project-ranking";

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

function projectInitials(name: string) {
  return name
    .split(/[\s./_-]+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function breakableProjectName(name: string) {
  const segments = name.split(/(?<=[a-z])(?=[A-Z])/g);

  return segments.map((segment, index) => (
    <span key={`${segment}-${index}`}>
      {index > 0 ? <wbr /> : null}
      {segment}
    </span>
  ));
}

type RankStyle = CSSProperties & {
  "--logo-size": string;
  "--name-size": string;
  "--mark-basis": string;
  "--rank-grow": string;
};

type ZoneStyle = CSSProperties & {
  "--project-columns": number;
  "--project-rows": number;
};

type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type WeightedZone = {
  zone: string;
  projects: LandscapeProject[];
  weight: number;
  area: number;
};

const STAGE_ASPECT_RATIO: Record<StageId, number> = {
  application: 6.2,
  framework: 8.4,
  runtime: 5.3,
  model: 2.05,
};

const MODEL_STAGES = [
  {
    label: "Access & Serving",
    description: "Closest to model workloads",
    rows: [
      [
        "Model API gateways",
        "Serving · Deploy",
        "Serving · Inference",
      ],
    ],
  },
  {
    label: "Model Training",
    description: "Post-train and pre-train systems",
    rows: [
      [
        "Post-Train · Reinforcement learning",
        "Post-Train · Supervised fine-tuning",
      ],
      [
        "Pre-Train · Framework & parallel",
        "Pre-Train · Compiler & accelerator",
        "Pre-Train · Evaluation & observability",
        "Pre-Train · Robotics infra",
      ],
    ],
  },
  {
    label: "Data & Compute",
    description: "Foundation for model development",
    rows: [
      [
        "Data · Labeling",
        "Data · Integration",
        "Data · Governance",
        "Compute & scheduling",
      ],
    ],
  },
] as const;

const MODEL_STAGE_ASPECT_RATIO: Record<
  (typeof MODEL_STAGES)[number]["label"],
  number
> = {
  "Access & Serving": 6.83,
  "Model Training": 4.74,
  "Data & Compute": 6.83,
};

const COMPACT_NUMBER = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const LANDSCAPE_CANVAS_WIDTH = 1440;
const LANDSCAPE_CANVAS_HEIGHT = 810;

function FixedLandscapeFrame({
  children,
  fitViewport,
  allowUpscale,
}: {
  children: ReactNode;
  fitViewport?: boolean;
  allowUpscale?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const fit = () => {
      const heightScale = fitViewport
        ? window.innerHeight / LANDSCAPE_CANVAS_HEIGHT
        : 1;
      setScale(
        Math.min(
          allowUpscale ? Number.POSITIVE_INFINITY : 1,
          viewport.clientWidth / LANDSCAPE_CANVAS_WIDTH,
          heightScale,
        ),
      );
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    if (fitViewport) window.addEventListener("resize", fit);

    return () => {
      observer.disconnect();
      if (fitViewport) window.removeEventListener("resize", fit);
    };
  }, [allowUpscale, fitViewport]);

  return (
    <div ref={viewportRef} className={styles.boardViewport}>
      <div
        className={styles.landscapeFrameSizer}
        style={{
          width: LANDSCAPE_CANVAS_WIDTH * scale,
          height: LANDSCAPE_CANVAS_HEIGHT * scale,
        }}
      >
        <div
          className={styles.landscapeFrameSurface}
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function projectGrid(count: number, aspectRatio: number) {
  if (count <= 1) return { columns: 1, rows: 1 };

  let columns = Math.max(
    1,
    Math.min(count, Math.round(Math.sqrt(count * aspectRatio))),
  );

  if (count === 2 && aspectRatio < 1) columns = 1;
  if (count === 3 && aspectRatio < 2) columns = 2;
  if (count === 4 && aspectRatio > 0.55 && aspectRatio < 2.2) {
    columns = 2;
  }

  return {
    columns,
    rows: Math.ceil(count / columns),
  };
}

function worstRowAspect(row: WeightedZone[], shortSide: number) {
  if (!row.length) return Number.POSITIVE_INFINITY;

  const area = row.reduce((sum, item) => sum + item.area, 0);
  const largest = Math.max(...row.map((item) => item.area));
  const smallest = Math.min(...row.map((item) => item.area));
  const sideSquared = shortSide ** 2;

  return Math.max(
    (sideSquared * largest) / area ** 2,
    area ** 2 / (sideSquared * smallest),
  );
}

function placeTreemapRow(
  row: WeightedZone[],
  remaining: LayoutRect,
  layouts: Map<string, LayoutRect>,
) {
  const rowArea = row.reduce((sum, item) => sum + item.area, 0);

  if (remaining.width >= remaining.height) {
    const columnWidth = rowArea / remaining.height;
    let y = remaining.y;

    row.forEach((item) => {
      const height = item.area / columnWidth;
      layouts.set(item.zone, {
        x: remaining.x,
        y,
        width: columnWidth,
        height,
      });
      y += height;
    });

    return {
      x: remaining.x + columnWidth,
      y: remaining.y,
      width: Math.max(0, remaining.width - columnWidth),
      height: remaining.height,
    };
  }

  const rowHeight = rowArea / remaining.width;
  let x = remaining.x;

  row.forEach((item) => {
    const width = item.area / rowHeight;
    layouts.set(item.zone, {
      x,
      y: remaining.y,
      width,
      height: rowHeight,
    });
    x += width;
  });

  return {
    x: remaining.x,
    y: remaining.y + rowHeight,
    width: remaining.width,
    height: Math.max(0, remaining.height - rowHeight),
  };
}

function buildTreemap(items: Omit<WeightedZone, "area">[], aspect: number) {
  const width = 1000;
  const height = width / aspect;
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const scale = (width * height) / totalWeight;
  const remainingItems: WeightedZone[] = items
    .map((item) => ({ ...item, area: item.weight * scale }))
    .sort((a, b) => b.area - a.area);
  const layouts = new Map<string, LayoutRect>();
  let remaining: LayoutRect = { x: 0, y: 0, width, height };
  let row: WeightedZone[] = [];

  while (remainingItems.length) {
    const candidate = remainingItems[0];
    const shortSide = Math.min(remaining.width, remaining.height);
    const nextRow = [...row, candidate];

    if (
      !row.length ||
      worstRowAspect(nextRow, shortSide) <=
        worstRowAspect(row, shortSide)
    ) {
      row = nextRow;
      remainingItems.shift();
    } else {
      remaining = placeTreemapRow(row, remaining, layouts);
      row = [];
    }
  }

  if (row.length) placeTreemapRow(row, remaining, layouts);

  return new Map(
    [...layouts].map(([zone, rect]) => [
      zone,
      {
        x: (rect.x / width) * 100,
        y: (rect.y / height) * 100,
        width: (rect.width / width) * 100,
        height: (rect.height / height) * 100,
      },
    ]),
  );
}

function ProjectMark({
  project,
  rankScale,
  matched,
  selected,
  focused,
  onSelect,
}: {
  project: LandscapeProject;
  rankScale: number;
  matched: boolean;
  selected: boolean;
  focused?: boolean;
  onSelect: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const stableScale = Number(rankScale.toFixed(6));
  const visualScale = Number(Math.pow(stableScale, 0.76).toFixed(6));
  const labelDemand = Math.min(
    42,
    Math.max(0, project.name.length - 10) * 2.4,
  );
  const labelScale = Math.max(
    0.74,
    1 - Math.max(0, project.name.length - 18) * 0.035,
  );
  const style: RankStyle = {
    "--logo-size": `${(32 + visualScale * 42).toFixed(3)}px`,
    "--name-size": `${(
      (10.2 + visualScale * 3.8) *
      labelScale
    ).toFixed(3)}px`,
    "--mark-basis": `${(
      88 +
      visualScale * 72 +
      labelDemand
    ).toFixed(3)}px`,
    "--rank-grow": (0.72 + visualScale * 2.28).toFixed(3),
  };

  return (
    <button
      className={cn(
        styles.projectMark,
        focused && styles.focusedProjectMark,
        !matched && styles.projectMarkDimmed,
        selected && styles.projectMarkSelected,
      )}
      type="button"
      style={style}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${project.name}, OpenRank ${formatOpenRank(project)}`}
      data-landscape-project
      data-landscape-signal={project.trendSignal ?? undefined}
    >
      <span className={styles.projectLogoWrap} data-landscape-logo>
        <span className={styles.projectLogo}>
          {!logoFailed ? (
            <Image
              src={projectLogoUrl(project.owner)}
              width={112}
              height={96}
              unoptimized
              data-export-logo-owner={project.owner}
              decoding="async"
              loading="eager"
              alt=""
              style={{
                width: "100%",
                height: "100%",
                maxWidth: "100%",
                maxHeight: "100%",
                padding: 4,
                objectFit: "contain",
                display: "block",
              }}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className={styles.projectLogoFallback}>
              {projectInitials(project.name)}
            </span>
          )}
        </span>
        {project.trendSignal ? (
          <span
            className={styles.projectNewBadge}
            data-signal={project.trendSignal}
            title={project.trendSignalReason}
            aria-label={
              project.trendSignal === "new"
                ? "New project in the last three months"
                : "Project with strong recent growth"
            }
          >
            {project.trendSignal === "new" ? "NEW" : "RISING"}
          </span>
        ) : null}
      </span>
      <span className={styles.projectName} data-landscape-project-name>
        {breakableProjectName(project.name)}
      </span>
      {focused ? (
        <span className={styles.focusedProjectMeta}>
          {project.owner} · OR {formatOpenRank(project)}
        </span>
      ) : null}
      <span className={styles.projectRank}>
        <strong>{formatOpenRank(project)}</strong>
        <small>OpenRank</small>
      </span>
    </button>
  );
}

function ZoneSection({
  zone,
  zoneProjects,
  normalizedQuery,
  selectedRepo,
  presentationFocus,
  rankScale,
  onSelect,
  expanded,
  style,
  aspectRatio,
  className,
}: {
  zone: string;
  zoneProjects: LandscapeProject[];
  normalizedQuery: string;
  selectedRepo: string | null;
  presentationFocus?: string;
  rankScale: (project: LandscapeProject) => number;
  onSelect: (repo: string) => void;
  expanded?: boolean;
  style?: CSSProperties;
  aspectRatio: number;
  className?: string;
}) {
  const rankedZoneValues = zoneProjects
    .map((project) => project.openrank)
    .filter((value): value is number => value !== null && value > 0)
    .map((value) => Math.log1p(value));
  const zoneMin = Math.min(...rankedZoneValues);
  const zoneMax = Math.max(...rankedZoneValues);
  const zoneRange = zoneMax - zoneMin;
  const getZoneRankScale = (project: LandscapeProject) => {
    if (!project.openrank) return 0;
    const absoluteScale = rankScale(project);
    const localScale =
      rankedZoneValues.length === 1
        ? 1
        : (Math.log1p(project.openrank) - zoneMin) / (zoneRange || 1);

    return Math.max(
      0,
      Math.min(1, localScale * 0.68 + absoluteScale * 0.32),
    );
  };
  const [zoneFamily, zoneName = zone] = zone.includes(" · ")
    ? zone.split(" · ", 2)
    : ["", zone];
  const grid = projectGrid(zoneProjects.length, aspectRatio);
  const zoneStyle: ZoneStyle = {
    ...style,
    "--project-columns": grid.columns,
    "--project-rows": grid.rows,
  };
  const title = (
    <Badge className={styles.zoneTitleBadge} variant="outline">
      <span>{zoneFamily ? `${zoneFamily} / ${zoneName}` : zoneName}</span>
    </Badge>
  );

  return (
    <section
      data-landscape-zone
      data-presentation-focus={
        presentationFocus === zone ? "true" : undefined
      }
      data-presentation-muted={
        presentationFocus && presentationFocus !== zone ? "true" : undefined
      }
      className={cn(styles.zone, className)}
      style={zoneStyle}
    >
      <header className={styles.zoneHeader}>
        <span aria-hidden="true" />
        <h4>{title}</h4>
        <Badge className={styles.zoneCountBadge} variant="secondary">
          {zoneProjects.length}
        </Badge>
        <span aria-hidden="true" />
      </header>
      <div className={styles.projectCloud}>
        {zoneProjects.map((zoneProject) => (
          <ProjectMark
            key={zoneProject.repo}
            project={zoneProject}
            rankScale={getZoneRankScale(zoneProject)}
            matched={matchesQuery(zoneProject, normalizedQuery)}
            selected={selectedRepo === zoneProject.repo}
            focused={expanded}
            onSelect={() => onSelect(zoneProject.repo)}
          />
        ))}
      </div>
    </section>
  );
}

function StageSection({
  stage,
  projects,
  normalizedQuery,
  selectedRepo,
  presentationFocus,
  rankScale,
  onSelect,
  focused,
  onFocusStage,
}: {
  stage: StageDefinition;
  projects: LandscapeProject[];
  normalizedQuery: string;
  selectedRepo: string | null;
  presentationFocus?: string;
  rankScale: (project: LandscapeProject) => number;
  onSelect: (repo: string) => void;
  focused?: boolean;
  onFocusStage?: (stage: StageId) => void;
}) {
  const stageProjects = projects.filter(
    (project) => project.stage === stage.id,
  );
  const zones = [...new Set(stageProjects.map((project) => project.zone))];
  const zoneItems = zones.map((zone) => {
    const zoneProjects = stageProjects
      .filter((project) => project.zone === zone)
      .sort(
        (a, b) =>
          (b.openrank ?? -1) - (a.openrank ?? -1) ||
          a.name.localeCompare(b.name),
      );
    const weight =
      1.1 +
      zoneProjects.reduce(
        (sum, project) =>
          sum +
          1 +
          rankScale(project) * 0.55 +
          Math.min(project.name.length, 24) * 0.006,
        0,
      );

    return { zone, projects: zoneProjects, weight };
  });
  const stageAspect = focused ? 2.08 : STAGE_ASPECT_RATIO[stage.id];
  const zoneLayouts = buildTreemap(
    zoneItems,
    stageAspect,
  );

  const stageTitle = (
    <>
      <div>
        <h3>{stage.label}</h3>
        <span>{stage.description}</span>
      </div>
      <em>
        {stageProjects.length}
        {onFocusStage ? <Maximize2Icon aria-hidden="true" /> : null}
      </em>
    </>
  );

  return (
    <article
      className={cn(
        styles.stage,
        styles[`stage_${stage.id}`],
        focused && styles.stageFocused,
      )}
      data-focused-stage={focused ? stage.id : undefined}
    >
      {onFocusStage ? (
        <button
          className={styles.stageLabel}
          type="button"
          aria-pressed={focused}
          aria-label={`Focus ${stage.label}`}
          onClick={() => onFocusStage(stage.id)}
        >
          {stageTitle}
        </button>
      ) : (
        <header className={styles.stageLabel}>{stageTitle}</header>
      )}

      <div className={styles.stageGrid}>
        {zoneItems.map(({ zone, projects: zoneProjects }) => {
          const layout = zoneLayouts.get(zone)!;
          const zoneStyle: CSSProperties = {
            left: `${layout.x}%`,
            top: `${layout.y}%`,
            width: `${layout.width}%`,
            height: `${layout.height}%`,
          };

          return (
            <ZoneSection
              key={zone}
              zone={zone}
              zoneProjects={zoneProjects}
              normalizedQuery={normalizedQuery}
              selectedRepo={selectedRepo}
              presentationFocus={presentationFocus}
              rankScale={rankScale}
              onSelect={onSelect}
              expanded={focused}
              style={zoneStyle}
              aspectRatio={
                (stageAspect * layout.width) /
                layout.height
              }
            />
          );
        })}
      </div>
    </article>
  );
}

function ModelStageSection({
  definition,
  projects,
  normalizedQuery,
  selectedRepo,
  presentationFocus,
  rankScale,
  onSelect,
  focused,
  onFocusStage,
}: {
  definition: (typeof MODEL_STAGES)[number];
  projects: LandscapeProject[];
  normalizedQuery: string;
  selectedRepo: string | null;
  presentationFocus?: string;
  rankScale: (project: LandscapeProject) => number;
  onSelect: (repo: string) => void;
  focused?: boolean;
  onFocusStage?: (stage: string) => void;
}) {
  const modelProjects = projects.filter(
    (project) => project.stage === "model",
  );
  const rows = definition.rows.map((rowZones) => {
    const items = rowZones.map((zone) => {
      const zoneProjects = modelProjects
        .filter((project) => project.zone === zone)
        .sort(
          (a, b) =>
            (b.openrank ?? -1) - (a.openrank ?? -1) ||
            a.name.localeCompare(b.name),
        );
      const weight =
        1.25 +
        zoneProjects.reduce(
          (sum, project) =>
            sum +
            1 +
            rankScale(project) * 0.5 +
            Math.min(project.name.length, 24) * 0.005,
          0,
        );

      return { zone, projects: zoneProjects, weight };
    });
    const projectCount = items.reduce(
      (sum, item) => sum + item.projects.length,
      0,
    );

    return {
      items,
      weight: 3 + projectCount,
    };
  });
  const totalRowWeight = rows.reduce(
    (sum, row) => sum + row.weight,
    0,
  );
  const macroAspect = MODEL_STAGE_ASPECT_RATIO[definition.label];
  const projectCount = rows.reduce(
    (sum, row) =>
      sum + row.items.reduce((rowSum, item) => rowSum + item.projects.length, 0),
    0,
  );
  const stageTitle = (
    <>
      <div>
        <h3>{definition.label}</h3>
        <span>{definition.description}</span>
      </div>
      <em>
        {projectCount}
        {onFocusStage ? <Maximize2Icon aria-hidden="true" /> : null}
      </em>
    </>
  );

  return (
    <article
      className={cn(
        styles.stage,
        styles.stage_model,
        styles.modelMacroStage,
        focused && styles.stageFocused,
      )}
      data-focused-stage={focused ? definition.label : undefined}
    >
      {onFocusStage ? (
        <button
          className={styles.stageLabel}
          type="button"
          aria-pressed={focused}
          aria-label={`Focus ${definition.label}`}
          onClick={() => onFocusStage(definition.label)}
        >
          {stageTitle}
        </button>
      ) : (
        <header className={styles.stageLabel}>{stageTitle}</header>
      )}
      <div
        className={styles.modelStageGrid}
        style={{
          gridTemplateRows: rows
            .map((row) => `${row.weight}fr`)
            .join(" "),
        }}
      >
        {rows.map((row, rowIndex) => {
          const rowAspect =
            macroAspect * (totalRowWeight / row.weight);
          const totalItemWeight = row.items.reduce(
            (sum, item) => sum + item.weight,
            0,
          );

          return (
            <div
              key={`${definition.label}-${rowIndex}`}
              className={styles.modelStageRow}
              style={{
                gridTemplateColumns: row.items
                  .map((item) => `${item.weight}fr`)
                  .join(" "),
              }}
            >
              {row.items.map(
                ({ zone, projects: zoneProjects, weight }) => (
                  <ZoneSection
                    key={zone}
                    zone={zone}
                    zoneProjects={zoneProjects}
                    normalizedQuery={normalizedQuery}
                    selectedRepo={selectedRepo}
                    presentationFocus={presentationFocus}
                    rankScale={rankScale}
                    onSelect={onSelect}
                    expanded={focused}
                    aspectRatio={
                      rowAspect * (weight / totalItemWeight)
                    }
                    className={styles.modelStageZone}
                  />
                ),
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ModuleSummaryStrip({
  summary,
}: {
  summary: {
    projects: number;
    zones: number;
    openrank: number;
    stars: number;
    newProjects: number;
  };
}) {
  const metrics = [
    { label: "Projects", value: summary.projects.toLocaleString() },
    { label: "Sections", value: summary.zones.toLocaleString() },
    { label: "OpenRank", value: COMPACT_NUMBER.format(summary.openrank) },
    { label: "Stars", value: COMPACT_NUMBER.format(summary.stars) },
    { label: "Trend", value: summary.newProjects.toLocaleString() },
  ];

  return (
    <dl className={styles.moduleSummaryStrip}>
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EcosystemArchitecture() {
  return (
    <section
      className={styles.ecosystemArchitecture}
      id="ecosystem-architecture"
      aria-labelledby="ecosystem-architecture-title"
    >
      <header className={styles.architectureHeader}>
        <h2 id="ecosystem-architecture-title">
          Agentic AI ecosystem architecture
        </h2>
        <div className={styles.architectureLegend} aria-label="Diagram legend">
          <span>Technical stack</span>
          <span>Reusable assets</span>
        </div>
      </header>

      <div className={styles.architectureMap}>
        <div className={styles.architectureStack}>
          <a
            className={cn(styles.architectureLayer, styles.architectureAgent)}
            href="#agent-infra"
          >
            <strong>Agent Infra</strong>
            <span>Applications</span>
            <span>Frameworks</span>
            <span>Runtime</span>
          </a>

          <div className={styles.architectureConnector} aria-hidden="true">
            <span />
          </div>

          <a
            className={cn(styles.architectureLayer, styles.architectureModel)}
            href="#model-infra"
          >
            <strong>Model Infra</strong>
            <span>Access &amp; serving</span>
            <span>Training</span>
            <span>Data &amp; compute</span>
          </a>

          <div className={styles.architectureConnector} aria-hidden="true">
            <span />
          </div>

          <a
            className={cn(styles.architectureLayer, styles.architectureModels)}
            href="#large-models"
          >
            <strong>Large Models</strong>
            <span>Open weights</span>
            <span>API models</span>
            <span>Capability &amp; usage</span>
          </a>
        </div>

        <a className={styles.architectureAssets} href="#awesome-list">
          <span className={styles.assetsDirection} aria-hidden="true" />
          <strong>Awesome × Agentic</strong>
          <div>
            <span>Discover</span>
            <span>Reuse</span>
            <span>Install</span>
            <span>Operate</span>
          </div>
        </a>
      </div>
    </section>
  );
}

function EmbeddedLandscape({
  id,
  title,
  detail,
  src,
  accent,
}: {
  id: string;
  title: string;
  detail: string;
  src: string;
  accent: "models" | "awesome";
}) {
  return (
    <section
      className={cn(
        styles.landscapeModule,
        styles.embeddedLandscapeModule,
        accent === "models"
          ? styles.largeModelsModule
          : styles.awesomeLandscapeModule,
      )}
      id={id}
    >
      <header className={styles.embeddedModuleHeader}>
        <div className={styles.moduleHeading}>
          <h2>{title}</h2>
          <p>{detail}</p>
        </div>
        <a
          className={styles.canvasLink}
          href={src}
          target="_blank"
          rel="noreferrer"
        >
          Open full canvas
          <ArrowUpRightIcon aria-hidden="true" />
        </a>
      </header>

      <div className={styles.embeddedLandscapeFrame}>
        <iframe
          src={src}
          title={`${title} Landscape 2026`}
          loading="lazy"
        />
      </div>
    </section>
  );
}

export default function LandscapeExplorer({
  projects,
  embedOnly,
  standalone,
  presentationFocus,
  presentationMode,
  filterQuery,
}: {
  projects: LandscapeProject[];
  embedOnly?: "agent" | "model";
  standalone?: boolean;
  presentationFocus?: string;
  presentationMode?: boolean;
  filterQuery?: string;
}) {
  const [infraQuery, setInfraQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [focusedStage, setFocusedStage] = useState<{
    module: "agent" | "model";
    stage: string;
  } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<"agent" | "model">(
    "agent",
  );
  const [dialogScope, setDialogScope] = useState<"agent" | "model" | null>(
    embedOnly ?? null,
  );
  const agentSlideRef = useRef<HTMLElement>(null);
  const modelSlideRef = useRef<HTMLElement>(null);
  const [agentDialogHost, setAgentDialogHost] =
    useState<HTMLDivElement | null>(null);
  const [modelDialogHost, setModelDialogHost] =
    useState<HTMLDivElement | null>(null);
  const activeInfraQuery = filterQuery ?? infraQuery;
  const normalizedInfraQuery = activeInfraQuery.trim().toLowerCase();

  useEffect(() => {
    if (!focusedStage || selectedRepo) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusedStage(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedStage, selectedRepo]);

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

  const agentProjects = projects.filter(
    (project) => project.stage !== "model",
  );
  const modelProjects = projects.filter(
    (project) => project.stage === "model",
  );
  const summarizeModule = (moduleProjects: LandscapeProject[]) => ({
    projects: moduleProjects.length,
    zones: new Set(moduleProjects.map((project) => project.zone)).size,
    openrank: moduleProjects.reduce(
      (sum, project) => sum + (project.openrank ?? 0),
      0,
    ),
    stars: moduleProjects.reduce(
      (sum, project) => sum + project.stars,
      0,
    ),
    newProjects: moduleProjects.filter((project) => project.trendSignal)
      .length,
  });
  const agentSummary = summarizeModule(agentProjects);
  const modelSummary = summarizeModule(modelProjects);
  const agentMatchCount = agentProjects.filter((project) =>
    matchesQuery(project, normalizedInfraQuery),
  ).length;
  const modelMatchCount = modelProjects.filter((project) =>
    matchesQuery(project, normalizedInfraQuery),
  ).length;
  const agentStages = STAGES.filter((stage) => stage.id !== "model");
  const agentStageStyle: CSSProperties = {
    gridTemplateRows: agentStages
      .map((stage) => {
        const stageProjects = projects.filter(
          (project) => project.stage === stage.id,
        );
        const zoneCount = new Set(
          stageProjects.map((project) => project.zone),
        ).size;
        return `${
          18 + stageProjects.length * 0.55 + zoneCount * 1.2
        }fr`;
      })
      .join(" "),
  };
  const modelStageStyle: CSSProperties = {
    gridTemplateRows: MODEL_STAGES.map((definition) => {
      const stageZones = new Set<string>(definition.rows.flat());
      const projectCount = projects.filter(
        (project) =>
          project.stage === "model" && stageZones.has(project.zone),
      ).length;

      return `${8 + projectCount}fr`;
    }).join(" "),
  };

  return (
    <section
      className={cn(styles.explorer, embedOnly && styles.embedExplorer)}
      id="landscape"
      aria-label={
        embedOnly
          ? `${embedOnly === "agent" ? "Agent" : "Model"} Infra landscape`
          : "Interactive Agentic AI open-source landscape"
      }
    >
      {!embedOnly ? (
        <>
          <div className={styles.landscapeLead} id="landscape-home">
            <h1>Map the Infrastructure Behind Agentic AI</h1>
          </div>
          <EcosystemArchitecture />

          <div className={styles.sharedInfraSearchBar}>
            <label className={cn(styles.search, styles.sharedInfraSearch)}>
              <SearchIcon aria-hidden="true" />
              <span className={styles.srOnly}>
                Search Agent and Model Infra
              </span>
              <Input
                value={infraQuery}
                onChange={(event) => setInfraQuery(event.target.value)}
                placeholder="Search Agent & Model Infra"
              />
              {infraQuery ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  onClick={() => setInfraQuery("")}
                  aria-label="Clear Infra search"
                >
                  <XIcon />
                </Button>
              ) : null}
            </label>
            <span className={styles.srOnly} aria-live="polite">
              {normalizedInfraQuery
                ? `${agentMatchCount} Agent Infra matches and ${modelMatchCount} Model Infra matches`
                : `${agentProjects.length} Agent Infra projects and ${modelProjects.length} Model Infra projects`}
            </span>
          </div>
        </>
      ) : null}

      {embedOnly !== "model" ? (
        <section
          className={cn(
            styles.landscapeModule,
            styles.agentLandscapeModule,
          )}
          id="agent-infra"
        >
          {!embedOnly ? (
            <>
              <header className={styles.moduleHeader}>
                <div className={styles.moduleHeading}>
                  <h2>Agent Infra</h2>
                  <h3>Where agents are built, operated, and used.</h3>
                  <p>Applications · Frameworks · Runtime infrastructure</p>
                </div>
                <ModuleSummaryStrip summary={agentSummary} />
              </header>

              <div
                className={cn(
                  styles.moduleToolbar,
                  styles.moduleActionsToolbar,
                )}
              >
                <a
                  className={styles.canvasLink}
                  href="/embed/agent-infra"
                  target="_blank"
                  rel="noreferrer"
                >
                  Direct canvas
                  <ArrowUpRightIcon aria-hidden="true" />
                </a>
                <Button
                  className={styles.shareButton}
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShareTarget("agent");
                    setShareOpen(true);
                  }}
                >
                  <Share2Icon data-icon="inline-start" />
                  Share Agent Infra
                </Button>
              </div>
            </>
          ) : null}

          <FixedLandscapeFrame
            fitViewport={standalone || presentationMode}
            allowUpscale={presentationMode}
          >
            <div className={styles.landscapeBoard}>
              <section ref={agentSlideRef} className={styles.landscapeSlide}>
                <header className={styles.boardMasthead}>
                  <div className={styles.boardTitleLockup}>
                    <span aria-hidden="true">A</span>
                    <div>
                      <h2>Agent Infra Landscape 2026</h2>
                      <p>Applications · frameworks · runtime infrastructure</p>
                    </div>
                  </div>
                  <div className={styles.boardSource}>
                    <div className={styles.boardBrands}>
                      <strong>ANT OPEN SOURCE</strong>
                      <strong>INCLUSION AI</strong>
                    </div>
                    <span>
                      {agentProjects.length} projects · Jun OpenRank weighted
                    </span>
                    {focusedStage?.module === "agent" ? (
                      <button
                        className={styles.resetStageView}
                        type="button"
                        onClick={() => setFocusedStage(null)}
                      >
                        Back to overview
                      </button>
                    ) : null}
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
                      focusedStage?.module === "agent" &&
                        styles.stageStackFocused,
                    )}
                    style={
                      focusedStage?.module === "agent"
                        ? { gridTemplateRows: "minmax(0, 1fr)" }
                        : agentStageStyle
                    }
                  >
                    {agentStages
                      .filter(
                        (stage) =>
                          focusedStage?.module !== "agent" ||
                          focusedStage.stage === stage.id,
                      )
                      .map((stage) => (
                        <StageSection
                          key={stage.id}
                          stage={stage}
                          projects={projects}
                          normalizedQuery={normalizedInfraQuery}
                          selectedRepo={selectedRepo}
                          presentationFocus={presentationFocus}
                          rankScale={rankScale}
                          onSelect={(repo) => {
                            setDialogScope("agent");
                            setSelectedRepo(repo);
                          }}
                          focused={
                            focusedStage?.module === "agent" &&
                            focusedStage.stage === stage.id
                          }
                          onFocusStage={
                            presentationMode
                              ? undefined
                              : (stageId) =>
                                  setFocusedStage((current) =>
                                    current?.module === "agent" &&
                                    current.stage === stageId
                                      ? null
                                      : { module: "agent", stage: stageId },
                                  )
                          }
                        />
                      ))}
                  </div>
                </div>
              </section>
              <div
                ref={setAgentDialogHost}
                className={styles.landscapeDialogHost}
                aria-hidden={
                  !selectedProject || dialogScope !== "agent"
                }
              />
            </div>
          </FixedLandscapeFrame>
        </section>
      ) : null}

      {embedOnly !== "agent" ? (
        <section
          className={cn(
            styles.landscapeModule,
            styles.modelLandscapeModule,
          )}
          id="model-infra"
        >
          {!embedOnly ? (
            <>
              <header className={styles.moduleHeader}>
                <div className={styles.moduleHeading}>
                  <h2>Model Infra</h2>
                  <h3>The systems beneath model workloads.</h3>
                  <p>Access &amp; serving · Training · Data &amp; compute</p>
                </div>
                <ModuleSummaryStrip summary={modelSummary} />
              </header>

              <div
                className={cn(
                  styles.moduleToolbar,
                  styles.moduleActionsToolbar,
                )}
              >
                <a
                  className={styles.canvasLink}
                  href="/embed/model-infra"
                  target="_blank"
                  rel="noreferrer"
                >
                  Direct canvas
                  <ArrowUpRightIcon aria-hidden="true" />
                </a>
                <Button
                  className={styles.shareButton}
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShareTarget("model");
                    setShareOpen(true);
                  }}
                >
                  <Share2Icon data-icon="inline-start" />
                  Share Model Infra
                </Button>
              </div>
            </>
          ) : null}

          <FixedLandscapeFrame
            fitViewport={standalone || presentationMode}
            allowUpscale={presentationMode}
          >
            <div className={styles.landscapeBoard}>
              <section
                ref={modelSlideRef}
                className={cn(
                  styles.landscapeSlide,
                  styles.modelLandscapeSlide,
                )}
              >
                <header className={styles.boardMasthead}>
                  <div className={styles.boardTitleLockup}>
                    <span aria-hidden="true">M</span>
                    <div>
                      <h2>Model Infra Landscape 2026</h2>
                      <p>Routing · serving · training · data · compute</p>
                    </div>
                  </div>
                  <div className={styles.boardSource}>
                    <div className={styles.boardBrands}>
                      <strong>ANT OPEN SOURCE</strong>
                      <strong>INCLUSION AI</strong>
                    </div>
                    <span>
                      {modelProjects.length} projects · Jun OpenRank weighted
                    </span>
                    {focusedStage?.module === "model" ? (
                      <button
                        className={styles.resetStageView}
                        type="button"
                        onClick={() => setFocusedStage(null)}
                      >
                        Back to overview
                      </button>
                    ) : null}
                  </div>
                </header>

                <div className={styles.landscapeBand}>
                  <aside
                    className={cn(styles.infraRail, styles.modelInfraRail)}
                    aria-hidden="true"
                  >
                    <span>Model Infra</span>
                  </aside>
                  <div
                    className={cn(
                      styles.stageStack,
                      styles.modelStageStack,
                      focusedStage?.module === "model" &&
                        styles.stageStackFocused,
                    )}
                    style={
                      focusedStage?.module === "model"
                        ? { gridTemplateRows: "minmax(0, 1fr)" }
                        : modelStageStyle
                    }
                  >
                    {MODEL_STAGES.filter(
                      (definition) =>
                        focusedStage?.module !== "model" ||
                        focusedStage.stage === definition.label,
                    ).map((definition) => (
                      <ModelStageSection
                        key={definition.label}
                        definition={definition}
                        projects={projects}
                        normalizedQuery={normalizedInfraQuery}
                        selectedRepo={selectedRepo}
                        presentationFocus={presentationFocus}
                        rankScale={rankScale}
                        onSelect={(repo) => {
                          setDialogScope("model");
                          setSelectedRepo(repo);
                        }}
                        focused={
                          focusedStage?.module === "model" &&
                          focusedStage.stage === definition.label
                        }
                        onFocusStage={
                          presentationMode
                            ? undefined
                            : (stageLabel) =>
                                setFocusedStage((current) =>
                                  current?.module === "model" &&
                                  current.stage === stageLabel
                                    ? null
                                    : { module: "model", stage: stageLabel },
                                )
                        }
                      />
                    ))}
                  </div>
                </div>
              </section>
              <div
                ref={setModelDialogHost}
                className={styles.landscapeDialogHost}
                aria-hidden={
                  !selectedProject || dialogScope !== "model"
                }
              />
            </div>
          </FixedLandscapeFrame>
        </section>
      ) : null}

      {!embedOnly ? (
        <>
          <EmbeddedLandscape
            id="large-models"
            title="Large Models"
            detail="Open weights · API access · usage · capability"
            src="/keynote/large-models/index.html"
            accent="models"
          />
          <EmbeddedLandscape
            id="awesome-list"
            title="Awesome × Agentic"
            detail="Discover · reuse · install · operate"
            src="/keynote/awesome/awesome_agentic_landscape_2026.html"
            accent="awesome"
          />
          <EcosystemSignals projects={projects} />
          <ProjectRanking
            projects={projects}
            onSelect={(repo) => {
              setDialogScope(null);
              setSelectedRepo(repo);
            }}
          />
        </>
      ) : null}

      {selectedProject ? (
        <ProjectInsightDialog
          key={selectedProject.repo}
          project={selectedProject}
          neighbors={selectedNeighbors}
          onClose={() => {
            setSelectedRepo(null);
            if (!embedOnly) setDialogScope(null);
          }}
          onSelect={setSelectedRepo}
          contained={Boolean(dialogScope)}
          portalContainer={
            dialogScope === "agent"
              ? agentDialogHost
              : dialogScope === "model"
                ? modelDialogHost
                : undefined
          }
        />
      ) : null}

      {!embedOnly ? (
        <LandscapeShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          initialSelection={shareTarget}
          getTarget={(id) =>
            id === "agent" ? agentSlideRef.current : modelSlideRef.current
          }
        />
      ) : null}
    </section>
  );
}
