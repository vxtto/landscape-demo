"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { LandscapeProject } from "@/lib/landscape-types";

import styles from "../page.module.css";

const OPENRANK_MONTHS = [
  { short: "Aug", label: "Aug 2025" },
  { short: "Sep", label: "Sep 2025" },
  { short: "Oct", label: "Oct 2025" },
  { short: "Nov", label: "Nov 2025" },
  { short: "Dec", label: "Dec 2025" },
  { short: "Jan", label: "Jan 2026" },
  { short: "Feb", label: "Feb 2026" },
  { short: "Mar", label: "Mar 2026" },
  { short: "Apr", label: "Apr 2026" },
  { short: "May", label: "May 2026" },
  { short: "Jun", label: "Jun 2026" },
] as const;

const TOP_PROJECTS = 12;

type BarStyle = CSSProperties & {
  "--bar-height": string;
};

function projectInitials(name: string) {
  return name
    .split(/[\s./_-]+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function compactProjectName(name: string) {
  return name.length > 22 ? `${name.slice(0, 21)}…` : name;
}

function formatValue(value: number) {
  return value.toLocaleString("en", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  });
}

export function ModuleOpenRankChart({
  module,
  projects,
  onSelect,
}: {
  module: "agent" | "model";
  projects: LandscapeProject[];
  onSelect: (repo: string) => void;
}) {
  const [monthIndex, setMonthIndex] = useState(
    OPENRANK_MONTHS.length - 1,
  );
  const month = OPENRANK_MONTHS[monthIndex];
  const leaders = useMemo(
    () =>
      projects
        .map((project) => ({
          project,
          value: project.trend[monthIndex],
        }))
        .filter(
          (
            item,
          ): item is { project: LandscapeProject; value: number } =>
            typeof item.value === "number" && item.value > 0,
        )
        .sort(
          (a, b) =>
            b.value - a.value ||
            a.project.name.localeCompare(b.project.name),
        )
        .slice(0, TOP_PROJECTS),
    [monthIndex, projects],
  );
  const maxValue = Math.max(...leaders.map((item) => item.value), 1);
  const axisTicks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <section
      className={styles.moduleOpenRankChart}
      data-module={module}
      aria-label={`${module === "agent" ? "Agent" : "Model"} Infra monthly OpenRank ranking`}
    >
      <header className={styles.moduleChartHeader}>
        <div>
          <h3>OpenRank by project</h3>
        </div>
        <div className={styles.moduleChartControls}>
          <span className={styles.moduleChartMonth}>
            <small>Selected month</small>
            <strong>{month.label}</strong>
          </span>
          <div className={styles.moduleChartStepper}>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={() =>
                setMonthIndex((value) => Math.max(0, value - 1))
              }
              disabled={monthIndex === 0}
              aria-label="Show previous OpenRank month"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={() =>
                setMonthIndex((value) =>
                  Math.min(OPENRANK_MONTHS.length - 1, value + 1),
                )
              }
              disabled={monthIndex === OPENRANK_MONTHS.length - 1}
              aria-label="Show next OpenRank month"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.moduleChartTimeline}>
        <input
          type="range"
          min={0}
          max={OPENRANK_MONTHS.length - 1}
          step={1}
          value={monthIndex}
          onChange={(event) => setMonthIndex(Number(event.target.value))}
          aria-label="Select OpenRank month"
        />
        <div aria-hidden="true">
          {OPENRANK_MONTHS.map((item, index) => (
            <span
              key={item.label}
              data-active={index === monthIndex ? "true" : undefined}
            >
              {item.short}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.moduleChartBody}>
        <div className={styles.moduleChartAxis} aria-hidden="true">
          {axisTicks.map((ratio) => (
            <span key={ratio}>
              {formatValue(Math.round(maxValue * ratio))}
            </span>
          ))}
        </div>
        <div className={styles.moduleChartViewport}>
          <div className={styles.moduleChartPlot}>
            <div className={styles.moduleChartGrid} aria-hidden="true">
              {axisTicks.map((ratio) => (
                <i key={ratio} />
              ))}
            </div>
            <ol className={styles.moduleChartBars}>
              {leaders.map(({ project, value }, index) => {
                const height = 34 + (value / maxValue) * 156;
                const style: BarStyle = {
                  "--bar-height": `${height.toFixed(2)}px`,
                };

                return (
                  <li key={project.repo}>
                    <button
                      type="button"
                      className={styles.moduleChartProject}
                      onClick={() => onSelect(project.repo)}
                      aria-label={`${project.name}, OpenRank ${formatValue(value)} in ${month.label}`}
                    >
                      <span className={styles.moduleTrendBarArea}>
                        <span
                          className={styles.moduleTrendBar}
                          data-rank={index + 1}
                          style={style}
                        >
                          <strong>{formatValue(value)}</strong>
                        </span>
                      </span>
                      <span className={styles.moduleTrendIdentity}>
                        <Avatar className={styles.moduleTrendLogo}>
                          <AvatarImage
                            src={`https://github.com/${project.owner}.png?size=80`}
                            alt=""
                          />
                          <AvatarFallback>
                            {projectInitials(project.name)}
                          </AvatarFallback>
                        </Avatar>
                        <small>#{index + 1}</small>
                        {project.landscapeAction === "add" ? (
                          <b>NEW</b>
                        ) : null}
                      </span>
                      <span
                        className={styles.moduleTrendProjectName}
                        title={project.name}
                      >
                        {compactProjectName(project.name)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
