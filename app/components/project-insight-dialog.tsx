"use client";

import Image from "next/image";
import { ArrowUpRightIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

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
import type { LandscapeProject } from "@/lib/landscape-types";
import { projectLogoUrl } from "@/lib/project-logo";

import styles from "../page.module.css";

const NUMBER_FORMAT = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const PRECISE_NUMBER_FORMAT = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

const TREND_MONTHS = [
  "Aug 2025",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan 2026",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
];

const OPENRANK_CHART_CONFIG = {
  openrank: {
    label: "OpenRank",
    color: "var(--signal-violet)",
  },
} satisfies ChartConfig;

function initials(value: string) {
  return value
    .split(/[\s./_-]+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | null | string;
}) {
  const displayValue =
    typeof value === "number"
      ? NUMBER_FORMAT.format(value)
      : value || "—";

  return (
    <Card className={styles.insightMetricCard}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{displayValue}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function StaticOpenRankTrend({
  project,
}: {
  project: LandscapeProject;
}) {
  const data = TREND_MONTHS.map((month, index) => ({
    month,
    openrank: project.trend[index],
  }));

  return (
    <Card className={styles.insightTrendCard}>
      <CardHeader>
        <CardTitle>OpenRank trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={OPENRANK_CHART_CONFIG}
          className={styles.staticInsightChart}
          initialDimension={{ width: 760, height: 220 }}
        >
          <LineChart data={data} margin={{ left: 2, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              width={42}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => NUMBER_FORMAT.format(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => (
                    <span>
                      {PRECISE_NUMBER_FORMAT.format(Number(value))}
                    </span>
                  )}
                />
              }
            />
            <Line
              dataKey="openrank"
              type="monotone"
              connectNulls
              stroke="var(--color-openrank)"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: "var(--color-openrank)" }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RepositoryDetails({ project }: { project: LandscapeProject }) {
  return (
    <Card className={styles.staticMetaCard}>
      <CardHeader>
        <CardTitle>Repository</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className={styles.staticMetaGrid}>
          <div>
            <dt>Forks</dt>
            <dd>{NUMBER_FORMAT.format(project.forks)}</dd>
          </div>
          <div>
            <dt>Open issues</dt>
            <dd>{NUMBER_FORMAT.format(project.openIssues)}</dd>
          </div>
          <div>
            <dt>License</dt>
            <dd>{project.license}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(project.createdAt)}</dd>
          </div>
          <div>
            <dt>Last pushed</dt>
            <dd>{formatDate(project.pushedAt)}</dd>
          </div>
          <div>
            <dt>Landscape section</dt>
            <dd>{project.zone}</dd>
          </div>
        </dl>

        {project.topics.length ? (
          <div className={styles.staticTopics}>
            {project.topics.slice(0, 10).map((topic) => (
              <Badge key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
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
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.insightDialog}>
        <DialogHeader className={styles.insightHeader}>
          <div className={styles.insightIdentity}>
            <Avatar className={styles.insightProjectAvatar}>
              <AvatarImage
                src={projectLogoUrl(project.owner)}
                decoding="async"
                alt={`${project.name} logo`}
              />
              <AvatarFallback>{initials(project.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className={styles.insightHeaderBadges}>
                <Badge variant="secondary">{project.zone}</Badge>
                <Badge variant="outline">{project.stage} layer</Badge>
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
          <div className={styles.insightContent}>
            <div className={styles.insightMetricGrid}>
              <MetricCard
                label="OpenRank · Jun 2026"
                value={project.openrank}
              />
              <MetricCard label="Stars" value={project.stars} />
              <MetricCard
                label="Participants · Jul 2026"
                value={project.participants}
              />
              <MetricCard
                label="Primary language"
                value={project.language}
              />
            </div>

            <div className={styles.staticInsightGrid}>
              <StaticOpenRankTrend project={project} />
              <RepositoryDetails project={project} />
            </div>

            {project.selectionReason || project.selectionCaveat ? (
              <Card className={styles.staticNotesCard}>
                <CardHeader>
                  <CardTitle>Landscape annotation</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.selectionReason ? (
                    <p>{project.selectionReason}</p>
                  ) : null}
                  {project.selectionCaveat ? (
                    <p>{project.selectionCaveat}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <footer className={styles.insightContextStrip}>
          <span>Same ecosystem section</span>
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
                  className={styles.neighborLogo}
                  src={projectLogoUrl(neighbor.owner)}
                  alt=""
                  width={20}
                  height={20}
                  loading="lazy"
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
