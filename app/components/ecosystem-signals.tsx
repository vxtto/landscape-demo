"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  Card,
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
import type { LandscapeProject } from "@/lib/landscape-types";

import styles from "../page.module.css";

const MONTHS = [
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
];

const NUMBER_FORMAT = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const SIGNAL_CHART_CONFIG = {
  agent: {
    label: "Agent Infra",
    color: "#ef72ca",
  },
  model: {
    label: "Model Infra",
    color: "#74b7e3",
  },
  application: {
    label: "Agent Application",
    color: "#e65fc1",
  },
  framework: {
    label: "Agent Framework",
    color: "#f19bd8",
  },
  runtime: {
    label: "Agent Runtime Infra",
    color: "#9f4b8d",
  },
  access: {
    label: "Access & Serving",
    color: "#58a6d8",
  },
  training: {
    label: "Model Training",
    color: "#94cbed",
  },
  foundation: {
    label: "Data & Compute",
    color: "#2e6f9c",
  },
  openrank: {
    label: "OpenRank",
    color: "#141414",
  },
  stars: {
    label: "Stars",
    color: "#717171",
  },
} satisfies ChartConfig;

function isAgentProject(project: LandscapeProject) {
  return project.stage !== "model";
}

function getModelField(project: LandscapeProject) {
  if (
    [
      "Model API gateways",
      "Serving · Deploy",
      "Serving · Inference",
    ].includes(project.zone)
  ) {
    return "access";
  }

  if (
    project.zone.startsWith("Post-Train") ||
    project.zone.startsWith("Pre-Train")
  ) {
    return "training";
  }

  return "foundation";
}

function sum(
  projects: LandscapeProject[],
  selector: (project: LandscapeProject) => number,
) {
  return projects.reduce((total, project) => total + selector(project), 0);
}

export function EcosystemSignals({
  projects,
}: {
  projects: LandscapeProject[];
}) {
  const agentProjects = projects.filter(isAgentProject);
  const modelProjects = projects.filter(
    (project) => project.stage === "model",
  );
  const totalOpenRank = sum(
    projects,
    (project) => project.openrank ?? 0,
  );
  const totalStars = sum(projects, (project) => project.stars);
  const totalParticipants = sum(
    projects,
    (project) => project.participants ?? 0,
  );
  const newProjects = projects.filter(
    (project) => project.trendSignal,
  ).length;

  const agentFieldTrend = MONTHS.map((month, index) => ({
    month,
    application: Math.round(
      sum(
        agentProjects.filter((project) => project.stage === "application"),
        (project) => project.trend[index] ?? 0,
      ),
    ),
    framework: Math.round(
      sum(
        agentProjects.filter((project) => project.stage === "framework"),
        (project) => project.trend[index] ?? 0,
      ),
    ),
    runtime: Math.round(
      sum(
        agentProjects.filter((project) => project.stage === "runtime"),
        (project) => project.trend[index] ?? 0,
      ),
    ),
  }));
  const modelFieldTrend = MONTHS.map((month, index) => ({
    month,
    access: Math.round(
      sum(
        modelProjects.filter(
          (project) => getModelField(project) === "access",
        ),
        (project) => project.trend[index] ?? 0,
      ),
    ),
    training: Math.round(
      sum(
        modelProjects.filter(
          (project) => getModelField(project) === "training",
        ),
        (project) => project.trend[index] ?? 0,
      ),
    ),
    foundation: Math.round(
      sum(
        modelProjects.filter(
          (project) => getModelField(project) === "foundation",
        ),
        (project) => project.trend[index] ?? 0,
      ),
    ),
  }));
  const leaders = [...projects]
    .filter(
      (project): project is LandscapeProject & { openrank: number } =>
        project.openrank !== null,
    )
    .sort((a, b) => b.openrank - a.openrank)
    .slice(0, 10)
    .map((project) => ({
      name: project.name,
      openrank: project.openrank,
      layer: isAgentProject(project) ? "agent" : "model",
    }));

  const languageRows = [
    ...projects.reduce((counts, project) => {
      const language = project.language || "—";
      const current = counts.get(language) ?? {
        language,
        agent: 0,
        model: 0,
      };
      current[isAgentProject(project) ? "agent" : "model"] += 1;
      counts.set(language, current);
      return counts;
    }, new Map<string, { language: string; agent: number; model: number }>()),
  ]
    .map(([, row]) => row)
    .sort((a, b) => b.agent + b.model - (a.agent + a.model))
    .slice(0, 8);

  const agentScatter = agentProjects
    .filter((project) => project.stars > 0 && (project.openrank ?? 0) > 0)
    .map((project) => ({
      name: project.name,
      stars: project.stars,
      openrank: project.openrank,
      participants: project.participants ?? 0,
    }));
  const modelScatter = modelProjects
    .filter((project) => project.stars > 0 && (project.openrank ?? 0) > 0)
    .map((project) => ({
      name: project.name,
      stars: project.stars,
      openrank: project.openrank,
      participants: project.participants ?? 0,
    }));

  const snapshotMetrics = [
    {
      label: "Projects",
      value: projects.length.toLocaleString(),
    },
    {
      label: "Stars",
      value: NUMBER_FORMAT.format(totalStars),
    },
    {
      label: "Participants · Jul 2026",
      value: NUMBER_FORMAT.format(totalParticipants),
    },
    {
      label: "OpenRank · Jun 2026",
      value: NUMBER_FORMAT.format(totalOpenRank),
    },
    {
      label: "Trend signals",
      value: newProjects.toLocaleString(),
    },
  ];

  return (
    <section className={styles.signals} id="signals">
      <div className={styles.signalsIntro}>
        <h2>Ecosystem signals</h2>
      </div>

      <div className={styles.signalMetricGrid}>
        {snapshotMetrics.map((metric) => (
          <Card key={metric.label} className={styles.signalMetricCard}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle>{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className={styles.signalDashboardGrid}>
        <Card className={styles.signalStackedCard}>
          <CardHeader>
            <CardTitle>Agent Infra OpenRank by field</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.signalStackLegend} aria-hidden="true">
              <span data-series="application">
                <i />
                Agent Application
              </span>
              <span data-series="framework">
                <i />
                Agent Framework
              </span>
              <span data-series="runtime">
                <i />
                Agent Runtime Infra
              </span>
            </div>
            <ChartContainer
              config={SIGNAL_CHART_CONFIG}
              className={styles.signalStackedChart}
            >
              <BarChart
                accessibilityLayer
                data={agentFieldTrend}
                barCategoryGap="24%"
                margin={{ left: 4, right: 14 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  width={52}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => NUMBER_FORMAT.format(value)}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="application"
                  stackId="openrank"
                  fill="var(--color-application)"
                />
                <Bar
                  dataKey="framework"
                  stackId="openrank"
                  fill="var(--color-framework)"
                />
                <Bar
                  dataKey="runtime"
                  stackId="openrank"
                  fill="var(--color-runtime)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className={styles.signalStackedCard}>
          <CardHeader>
            <CardTitle>Model Infra OpenRank by field</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.signalStackLegend} aria-hidden="true">
              <span data-series="access">
                <i />
                Access & Serving
              </span>
              <span data-series="training">
                <i />
                Model Training
              </span>
              <span data-series="foundation">
                <i />
                Data & Compute
              </span>
            </div>
            <ChartContainer
              config={SIGNAL_CHART_CONFIG}
              className={styles.signalStackedChart}
            >
              <BarChart
                accessibilityLayer
                data={modelFieldTrend}
                barCategoryGap="24%"
                margin={{ left: 4, right: 14 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  width={52}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => NUMBER_FORMAT.format(value)}
                />
                <ChartTooltip
                  cursor={{ fill: "#f0f0ed", opacity: 0.7 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="access"
                  stackId="openrank"
                  fill="var(--color-access)"
                />
                <Bar
                  dataKey="training"
                  stackId="openrank"
                  fill="var(--color-training)"
                />
                <Bar
                  dataKey="foundation"
                  stackId="openrank"
                  fill="var(--color-foundation)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className={styles.signalTallCard}>
          <CardHeader>
            <CardTitle>OpenRank leaders</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={SIGNAL_CHART_CONFIG}
              className={styles.signalRankingChart}
            >
              <BarChart
                data={leaders}
                layout="vertical"
                margin={{ left: 10, right: 28 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => NUMBER_FORMAT.format(value)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={112}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 650 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="openrank" radius={[0, 4, 4, 0]}>
                  {leaders.map((project) => (
                    <Cell
                      key={project.name}
                      fill={
                        project.layer === "agent"
                          ? "var(--color-agent)"
                          : "var(--color-model)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className={styles.signalLanguageCard}>
          <CardHeader>
            <CardTitle>Language composition</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={SIGNAL_CHART_CONFIG}
              className={styles.signalMediumChart}
            >
              <BarChart
                data={languageRows}
                layout="vertical"
                margin={{ left: 4, right: 18 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="language"
                  width={72}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 650 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="agent"
                  stackId="language"
                  fill="var(--color-agent)"
                />
                <Bar
                  dataKey="model"
                  stackId="language"
                  fill="var(--color-model)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className={styles.signalScatterCard}>
          <CardHeader>
            <CardTitle>Stars and OpenRank by project</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={SIGNAL_CHART_CONFIG}
              className={styles.signalMediumChart}
            >
              <ScatterChart margin={{ left: 8, right: 18, top: 10 }}>
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="stars"
                  name="Stars"
                  scale="log"
                  domain={["auto", "auto"]}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => NUMBER_FORMAT.format(value)}
                />
                <YAxis
                  type="number"
                  dataKey="openrank"
                  name="OpenRank"
                  scale="log"
                  domain={["auto", "auto"]}
                  width={48}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => NUMBER_FORMAT.format(value)}
                />
                <ZAxis
                  type="number"
                  dataKey="participants"
                  range={[35, 180]}
                />
                <ChartTooltip
                  content={<ChartTooltipContent labelKey="name" />}
                />
                <Scatter
                  name="Agent Infra"
                  data={agentScatter}
                  fill="var(--color-agent)"
                  fillOpacity={0.72}
                />
                <Scatter
                  name="Model Infra"
                  data={modelScatter}
                  fill="var(--color-model)"
                  fillOpacity={0.76}
                />
              </ScatterChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

    </section>
  );
}
