"use client";

import Image from "next/image";
import {
  ArrowUpRightIcon,
  Building2Icon,
  MapPinIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { LandscapeProject } from "@/lib/landscape-types";
import type {
  ProjectContributor,
  ProjectInsights,
} from "@/lib/project-insights-types";
import { cn } from "@/lib/utils";

import styles from "../page.module.css";

const NUMBER_FORMAT = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const PRECISE_NUMBER_FORMAT = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

const OPENRANK_CHART_CONFIG = {
  openrank: {
    label: "OpenRank",
    color: "var(--signal-violet)",
  },
} satisfies ChartConfig;

const PARTICIPANTS_CHART_CONFIG = {
  participants: {
    label: "Participants",
    color: "var(--stage-runtime)",
  },
} satisfies ChartConfig;

const CONTRIBUTOR_CHART_CONFIG = {
  openrank: {
    label: "Contributor OpenRank",
    color: "var(--signal-pink)",
  },
} satisfies ChartConfig;

type InsightState =
  | { status: "loading" }
  | { status: "ready"; data: ProjectInsights }
  | { status: "error" };

type ArenaStyle = CSSProperties & {
  "--arena-width": string;
};

function initials(value: string) {
  return value
    .split(/[\s./_-]+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatMonth(value: string | null) {
  if (!value) return "No month";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatMetric(value: number | null, precise = false) {
  if (value === null) return "—";
  return precise
    ? PRECISE_NUMBER_FORMAT.format(value)
    : NUMBER_FORMAT.format(value);
}

function InsightSkeleton() {
  return (
    <div className={styles.insightLoading} aria-label="Loading project data">
      <div className={styles.insightMetricGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className={styles.insightChartGrid}>
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-36 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  context,
  precise = false,
}: {
  label: string;
  value: number | null | string;
  context: string;
  precise?: boolean;
}) {
  return (
    <Card className={styles.insightMetricCard}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>
          {typeof value === "number"
            ? formatMetric(value, precise)
            : value || "—"}
        </CardTitle>
      </CardHeader>
      <CardContent>{context}</CardContent>
    </Card>
  );
}

function OpenRankTrend({ insights }: { insights: ProjectInsights }) {
  return (
    <Card className={styles.insightTrendCard}>
      <CardHeader>
        <CardTitle>{insights.dataYear} OpenRank trend</CardTitle>
        <CardDescription>
          Repository influence, measured monthly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={OPENRANK_CHART_CONFIG}
          className={styles.insightChart}
          initialDimension={{ width: 560, height: 180 }}
        >
          <AreaChart data={insights.trends} margin={{ left: 2, right: 10 }}>
            <defs>
              <linearGradient id="openrankFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-openrank)"
                  stopOpacity={0.26}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-openrank)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              width={38}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => NUMBER_FORMAT.format(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => (
                    <span>{PRECISE_NUMBER_FORMAT.format(Number(value))}</span>
                  )}
                />
              }
            />
            <Area
              dataKey="openrank"
              type="monotone"
              connectNulls
              fill="url(#openrankFill)"
              stroke="var(--color-openrank)"
              strokeWidth={2.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ParticipantsTrend({ insights }: { insights: ProjectInsights }) {
  return (
    <Card className={styles.insightTrendCard}>
      <CardHeader>
        <CardTitle>{insights.dataYear} participants trend</CardTitle>
        <CardDescription>
          Unique monthly contributors with OpenRank activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={PARTICIPANTS_CHART_CONFIG}
          className={styles.insightChart}
          initialDimension={{ width: 560, height: 180 }}
        >
          <AreaChart data={insights.trends} margin={{ left: 2, right: 10 }}>
            <defs>
              <linearGradient
                id="participantsFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-participants)"
                  stopOpacity={0.23}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-participants)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              width={38}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => NUMBER_FORMAT.format(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => (
                    <span>{NUMBER_FORMAT.format(Number(value))}</span>
                  )}
                />
              }
            />
            <Area
              dataKey="participants"
              type="monotone"
              connectNulls
              fill="url(#participantsFill)"
              stroke="var(--color-participants)"
              strokeWidth={2.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ContributorDetail({
  contributor,
}: {
  contributor: ProjectContributor;
}) {
  return (
    <section className={styles.contributorDetail}>
      <header>
        <Avatar className={styles.contributorAvatar}>
          <AvatarImage
            src={contributor.avatarUrl}
            alt={`${contributor.login} avatar`}
          />
          <AvatarFallback>{initials(contributor.login)}</AvatarFallback>
        </Avatar>
        <div>
          <div className={styles.contributorBadges}>
            <Badge>#{contributor.rank} Arena</Badge>
            <Badge variant="outline">{contributor.share}% share</Badge>
          </div>
          <h4>{contributor.name || contributor.login}</h4>
          <a
            href={`https://github.com/${contributor.login}`}
            target="_blank"
            rel="noreferrer"
          >
            @{contributor.login}
            <ArrowUpRightIcon aria-hidden="true" />
          </a>
        </div>
      </header>

      {contributor.company || contributor.location ? (
        <div className={styles.contributorMeta}>
          {contributor.company ? (
            <span>
              <Building2Icon aria-hidden="true" />
              {contributor.company}
            </span>
          ) : null}
          {contributor.location ? (
            <span>
              <MapPinIcon aria-hidden="true" />
              {contributor.location}
            </span>
          ) : null}
        </div>
      ) : null}

      <p className={styles.contributorBio}>
        {contributor.bio || "Public GitHub profile has no biography."}
      </p>

      <div className={styles.contributorScore}>
        <span>Monthly OpenRank</span>
        <strong>{PRECISE_NUMBER_FORMAT.format(contributor.openrank)}</strong>
      </div>

      <ChartContainer
        config={CONTRIBUTOR_CHART_CONFIG}
        className={styles.contributorChart}
        initialDimension={{ width: 420, height: 112 }}
      >
        <LineChart data={contributor.trend} margin={{ left: 2, right: 10 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="monthLabel"
            axisLine={false}
            tickLine={false}
            tickMargin={7}
          />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={(value) => (
                  <span>{PRECISE_NUMBER_FORMAT.format(Number(value))}</span>
                )}
              />
            }
          />
          <Line
            dataKey="openrank"
            type="monotone"
            stroke="var(--color-openrank)"
            strokeWidth={2.2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </section>
  );
}

function ContributorArena({ insights }: { insights: ProjectInsights }) {
  const [selectedContributorId, setSelectedContributorId] = useState<
    string | null
  >(null);
  const contributors = insights.arena.contributors;
  const selectedContributor =
    contributors.find(
      (contributor) => contributor.id === selectedContributorId,
    ) ??
    contributors[0] ??
    null;
  const leaderOpenrank = contributors[0]?.openrank || 1;

  return (
    <Card className={styles.arenaCard}>
      <CardHeader>
        <CardTitle>Contributor Arena</CardTitle>
        <CardDescription>
          {formatMonth(insights.arena.month)} · ranked by normalized monthly
          OpenRank
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.arenaWorkspace}>
        {contributors.length ? (
          <>
            <div className={styles.arenaList}>
              {contributors.map((contributor) => {
                const style: ArenaStyle = {
                  "--arena-width": `${Math.max(
                    8,
                    (contributor.openrank / leaderOpenrank) * 100,
                  )}%`,
                };

                return (
                  <button
                    key={contributor.id}
                    type="button"
                    className={cn(
                      styles.arenaRow,
                      selectedContributor?.id === contributor.id &&
                        styles.arenaRowActive,
                    )}
                    style={style}
                    onClick={() => setSelectedContributorId(contributor.id)}
                    aria-pressed={selectedContributor?.id === contributor.id}
                  >
                    <span className={styles.arenaRank}>
                      {String(contributor.rank).padStart(2, "0")}
                    </span>
                    <Avatar size="sm">
                      <AvatarImage src={contributor.avatarUrl} alt="" />
                      <AvatarFallback>
                        {initials(contributor.login)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={styles.arenaIdentity}>
                      <strong>{contributor.name || contributor.login}</strong>
                      <small>@{contributor.login}</small>
                    </span>
                    <span className={styles.arenaValue}>
                      {PRECISE_NUMBER_FORMAT.format(contributor.openrank)}
                    </span>
                    <i aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            {selectedContributor ? (
              <ContributorDetail contributor={selectedContributor} />
            ) : null}
          </>
        ) : (
          <Alert>
            <AlertTitle>No contributor ranking yet</AlertTitle>
            <AlertDescription>
              This repository has no normalized contributor OpenRank records
              for the latest available month.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function InsightContent({ insights }: { insights: ProjectInsights }) {
  return (
    <div className={styles.insightContent}>
      <div className={styles.insightMetricGrid}>
        <MetricCard
          label="OpenRank"
          value={insights.metrics.openrank}
          precise
          context={`${formatMonth(insights.metrics.openrankMonth)} snapshot`}
        />
        <MetricCard
          label="Stars"
          value={insights.metrics.stars}
          context="GitHub · refreshed weekly"
        />
        <MetricCard
          label="Participants"
          value={insights.metrics.participants}
          context={`${formatMonth(insights.metrics.participantsMonth)} · unique`}
        />
        <MetricCard
          label="Primary language"
          value={insights.metrics.language}
          context="Current GitHub repository metadata"
        />
      </div>

      <div className={styles.insightChartGrid}>
        <OpenRankTrend insights={insights} />
        <ParticipantsTrend insights={insights} />
      </div>

      <ContributorArena insights={insights} />
    </div>
  );
}

export function ProjectInsightDialog({
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
  const [state, setState] = useState<InsightState>({ status: "loading" });
  const [retryKey, setRetryKey] = useState(0);
  const endpoint = useMemo(() => {
    const [owner, repo] = project.repo.split("/");
    return `/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/insights`;
  }, [project.repo]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Insights request failed");
        return (await response.json()) as ProjectInsights;
      })
      .then((data) => setState({ status: "ready", data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, [endpoint, retryKey]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.insightDialog}>
        <DialogHeader className={styles.insightHeader}>
          <div className={styles.insightIdentity}>
            <Avatar className={styles.insightProjectAvatar}>
              <AvatarImage
                src={`https://github.com/${project.owner}.png?size=160`}
                alt={`${project.name} logo`}
              />
              <AvatarFallback>{initials(project.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className={styles.insightHeaderBadges}>
                <Badge variant="secondary">{project.zone}</Badge>
                <Badge variant="outline">{project.stage} layer</Badge>
                <Badge variant="outline">Weekly data</Badge>
              </div>
              <DialogTitle className={styles.insightTitle}>
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
          <DialogDescription className={styles.insightDescription}>
            {project.description}
          </DialogDescription>
        </DialogHeader>

        <div className={styles.insightBody}>
          {state.status === "loading" ? <InsightSkeleton /> : null}
          {state.status === "error" ? (
            <Alert variant="destructive" className={styles.insightError}>
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>Project data is temporarily unavailable</AlertTitle>
              <AlertDescription>
                The landscape is still available. Retry the protected data
                service when the connection recovers.
              </AlertDescription>
              <AlertAction>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setState({ status: "loading" });
                    setRetryKey((value) => value + 1);
                  }}
                >
                  <RefreshCwIcon data-icon="inline-start" />
                  Retry
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
          {state.status === "ready" ? (
            <InsightContent insights={state.data} />
          ) : null}
        </div>

        <footer className={styles.insightContextStrip}>
          <span>Same ecosystem zone</span>
          <div>
            {neighbors.slice(0, 6).map((neighbor) => (
              <Button
                key={neighbor.repo}
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => onSelect(neighbor.repo)}
              >
                <Image
                  src={`https://github.com/${neighbor.owner}.png?size=48`}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                />
                {neighbor.name}
              </Button>
            ))}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
