"use client";

import {
  Share2Icon,
  ZoomInIcon,
  ZoomOutIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import {
  type CSSProperties,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LandscapeProject, StageId } from "@/lib/landscape-types";
import { cn } from "@/lib/utils";

import styles from "../page.module.css";
import { EcosystemSignals } from "./ecosystem-signals";
import { LandscapeShareDialog } from "./landscape-share-dialog";
import { ModuleOpenRankChart } from "./module-openrank-chart";
import { ProjectInsightDialog } from "./project-insight-dialog";

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

const COMPACT_NUMBER = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

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
  onSelect,
}: {
  project: LandscapeProject;
  rankScale: number;
  matched: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
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
    "--logo-size": `${(28 + visualScale * 40).toFixed(3)}px`,
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
        !matched && styles.projectMarkDimmed,
        selected && styles.projectMarkSelected,
      )}
      type="button"
      style={style}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${project.name}, OpenRank ${formatOpenRank(project)}`}
      data-landscape-new={
        project.landscapeAction === "add" ? "true" : undefined
      }
    >
      <span className={styles.projectLogoWrap}>
        <Avatar className={styles.projectLogo}>
          <AvatarImage
            src={`https://github.com/${project.owner}.png?size=128`}
            data-export-logo-owner={project.owner}
            alt=""
          />
          <AvatarFallback>{projectInitials(project.name)}</AvatarFallback>
        </Avatar>
        {project.landscapeAction === "add" ? (
          <span
            className={styles.projectNewBadge}
            aria-label="New in this landscape edition"
          >
            NEW
          </span>
        ) : null}
      </span>
      <span className={styles.projectName}>
        {breakableProjectName(project.name)}
      </span>
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
  rankScale,
  onSelect,
  style,
  className,
}: {
  zone: string;
  zoneProjects: LandscapeProject[];
  normalizedQuery: string;
  selectedRepo: string | null;
  rankScale: (project: LandscapeProject) => number;
  onSelect: (repo: string) => void;
  style?: CSSProperties;
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

  return (
    <section
      data-landscape-zone
      className={cn(styles.zone, className)}
      style={style}
    >
      <header className={styles.zoneHeader}>
        <span aria-hidden="true" />
        <h4>
          <Badge className={styles.zoneTitleBadge} variant="outline">
            <span>
              {zoneFamily ? `${zoneFamily} / ${zoneName}` : zoneName}
            </span>
          </Badge>
        </h4>
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
  const zoneLayouts = buildTreemap(
    zoneItems,
    STAGE_ASPECT_RATIO[stage.id],
  );

  return (
    <article className={cn(styles.stage, styles[`stage_${stage.id}`])}>
      <header className={styles.stageLabel}>
        <h3>{stage.label}</h3>
        <span>{stage.description}</span>
      </header>

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
              rankScale={rankScale}
              onSelect={onSelect}
              style={zoneStyle}
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
  rankScale,
  onSelect,
}: {
  definition: (typeof MODEL_STAGES)[number];
  projects: LandscapeProject[];
  normalizedQuery: string;
  selectedRepo: string | null;
  rankScale: (project: LandscapeProject) => number;
  onSelect: (repo: string) => void;
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

  return (
    <article
      className={cn(
        styles.stage,
        styles.stage_model,
        styles.modelMacroStage,
      )}
    >
      <header className={styles.stageLabel}>
        <h3>{definition.label}</h3>
        <span>{definition.description}</span>
      </header>
      <div
        className={styles.modelStageGrid}
        style={{
          gridTemplateRows: rows
            .map((row) => `${row.weight}fr`)
            .join(" "),
        }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={`${definition.label}-${rowIndex}`}
            className={styles.modelStageRow}
            style={{
              gridTemplateColumns: row.items
                .map((item) => `${item.weight}fr`)
                .join(" "),
            }}
          >
            {row.items.map(({ zone, projects: zoneProjects }) => (
              <ZoneSection
                key={zone}
                zone={zone}
                zoneProjects={zoneProjects}
                normalizedQuery={normalizedQuery}
                selectedRepo={selectedRepo}
                rankScale={rankScale}
                onSelect={onSelect}
                className={styles.modelStageZone}
              />
            ))}
          </div>
        ))}
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
    { label: "New", value: summary.newProjects.toLocaleString() },
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

export default function LandscapeExplorer({
  projects,
}: {
  projects: LandscapeProject[];
}) {
  const [query, setQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<"agent" | "model">(
    "agent",
  );
  const [agentZoom, setAgentZoom] = useState(90);
  const [modelZoom, setModelZoom] = useState(90);
  const agentSlideRef = useRef<HTMLElement>(null);
  const modelSlideRef = useRef<HTMLElement>(null);
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
    newProjects: moduleProjects.filter(
      (project) => project.landscapeAction === "add",
    ).length,
  });
  const agentSummary = summarizeModule(agentProjects);
  const modelSummary = summarizeModule(modelProjects);
  const agentMatchCount = agentProjects.filter((project) =>
    matchesQuery(project, normalizedQuery),
  ).length;
  const modelMatchCount = modelProjects.filter((project) =>
    matchesQuery(project, normalizedQuery),
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
      className={styles.explorer}
      id="landscape"
      aria-label="Interactive Agentic AI open-source landscape"
    >
      <div className={styles.landscapeLead}>
        <div>
          <Badge variant="secondary">
            Agentic AI open-source ecosystem · Jul 2026
          </Badge>
          <h1>Map the infrastructure behind agentic AI.</h1>
          <p>
            A curated view of {projects.length} open-source projects across two
            complementary blocks: Agent Infra and Model Infra.
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

      <div className={styles.ecosystemToolbar}>
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
              <strong>{agentMatchCount + modelMatchCount}</strong> matches
              highlighted across both landscapes
            </>
          ) : (
            <>
              Search once across <strong>{projects.length}</strong> projects
            </>
          )}
        </div>
      </div>

      <section
        className={cn(
          styles.landscapeModule,
          styles.agentLandscapeModule,
        )}
        id="agent-infra"
      >
        <header className={styles.moduleHeader}>
          <div className={styles.moduleHeading}>
            <Badge>Agent Infra</Badge>
            <h2>Where agents are built, operated, and used.</h2>
            <p>
              Applications → frameworks → runtime infrastructure. Explore this
              block independently while keeping its original architecture map.
            </p>
          </div>
          <ModuleSummaryStrip summary={agentSummary} />
        </header>

        <ModuleOpenRankChart
          module="agent"
          projects={agentProjects}
          onSelect={setSelectedRepo}
        />

        <div className={styles.moduleToolbar}>
          <span className={styles.moduleMatch} aria-live="polite">
            {normalizedQuery ? (
              <>
                <strong>{agentMatchCount}</strong> Agent Infra matches
              </>
            ) : (
              <>
                <strong>{agentProjects.length}</strong> projects ·{" "}
                <strong>{agentSummary.zones}</strong> sections
              </>
            )}
          </span>
          <div className={styles.zoomControl} aria-label="Agent Infra zoom">
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={() =>
                setAgentZoom((value) => Math.max(70, value - 10))
              }
              disabled={agentZoom === 70}
              aria-label="Zoom Agent Infra out"
            >
              <ZoomOutIcon />
            </Button>
            <span>{agentZoom}%</span>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={() =>
                setAgentZoom((value) => Math.min(110, value + 10))
              }
              disabled={agentZoom === 110}
              aria-label="Zoom Agent Infra in"
            >
              <ZoomInIcon />
            </Button>
          </div>
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
          <span className={styles.scrollHint}>
            Scroll sideways to inspect →
          </span>
        </div>

        <div className={styles.boardViewport}>
          <div
            className={styles.landscapeBoard}
            style={{ zoom: agentZoom / 100 }}
          >
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
                  <strong>ANT OPEN SOURCE</strong>
                  <span>
                    {agentProjects.length} projects · Jun OpenRank weighted
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
                  style={agentStageStyle}
                >
                  {agentStages.map((stage) => (
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
      </section>

      <section
        className={cn(
          styles.landscapeModule,
          styles.modelLandscapeModule,
        )}
        id="model-infra"
      >
        <header className={styles.moduleHeader}>
          <div className={styles.moduleHeading}>
            <Badge>Model Infra</Badge>
            <h2>The systems beneath model workloads.</h2>
            <p>
              Access and serving → training → data and compute. A separate
              landscape for the model systems that power the agentic stack.
            </p>
          </div>
          <ModuleSummaryStrip summary={modelSummary} />
        </header>

        <ModuleOpenRankChart
          module="model"
          projects={modelProjects}
          onSelect={setSelectedRepo}
        />

        <div className={styles.moduleToolbar}>
          <span className={styles.moduleMatch} aria-live="polite">
            {normalizedQuery ? (
              <>
                <strong>{modelMatchCount}</strong> Model Infra matches
              </>
            ) : (
              <>
                <strong>{modelProjects.length}</strong> projects ·{" "}
                <strong>{modelSummary.zones}</strong> sections
              </>
            )}
          </span>
          <div className={styles.zoomControl} aria-label="Model Infra zoom">
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={() =>
                setModelZoom((value) => Math.max(70, value - 10))
              }
              disabled={modelZoom === 70}
              aria-label="Zoom Model Infra out"
            >
              <ZoomOutIcon />
            </Button>
            <span>{modelZoom}%</span>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={() =>
                setModelZoom((value) => Math.min(110, value + 10))
              }
              disabled={modelZoom === 110}
              aria-label="Zoom Model Infra in"
            >
              <ZoomInIcon />
            </Button>
          </div>
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
          <span className={styles.scrollHint}>
            Scroll sideways to inspect →
          </span>
        </div>

        <div className={styles.boardViewport}>
          <div
            className={styles.landscapeBoard}
            style={{ zoom: modelZoom / 100 }}
          >
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
                  <strong>ANT OPEN SOURCE</strong>
                  <span>
                    {modelProjects.length} projects · Jun OpenRank weighted
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
                <div
                  className={cn(
                    styles.stageStack,
                    styles.modelStageStack,
                  )}
                  style={modelStageStyle}
                >
                  {MODEL_STAGES.map((definition) => (
                    <ModelStageSection
                      key={definition.label}
                      definition={definition}
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
      </section>

      <EcosystemSignals projects={projects} />

      {selectedProject ? (
        <ProjectInsightDialog
          key={selectedProject.repo}
          project={selectedProject}
          neighbors={selectedNeighbors}
          onClose={() => setSelectedRepo(null)}
          onSelect={setSelectedRepo}
        />
      ) : null}

      <LandscapeShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        initialSelection={shareTarget}
        getTarget={(id) =>
          id === "agent" ? agentSlideRef.current : modelSlideRef.current
        }
      />
    </section>
  );
}
