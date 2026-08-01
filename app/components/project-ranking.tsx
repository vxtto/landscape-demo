"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { LandscapeProject } from "@/lib/landscape-types";
import { projectLogoUrl } from "@/lib/project-logo";

import styles from "../page.module.css";

const RANKING_MONTHS = [
  { label: "Aug 2025", index: 0 },
  { label: "Sep 2025", index: 1 },
  { label: "Oct 2025", index: 2 },
  { label: "Nov 2025", index: 3 },
  { label: "Dec 2025", index: 4 },
  { label: "Jan 2026", index: 5 },
  { label: "Feb 2026", index: 6 },
  { label: "Mar 2026", index: 7 },
  { label: "Apr 2026", index: 8 },
  { label: "May 2026", index: 9 },
  { label: "Jun 2026", index: 10 },
] as const;

const NUMBER_FORMAT = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
});

function projectLayer(project: LandscapeProject) {
  return project.stage === "model" ? "Model Infra" : "Agent Infra";
}

export function ProjectRanking({
  projects,
  onSelect,
}: {
  projects: LandscapeProject[];
  onSelect: (repo: string) => void;
}) {
  const [monthIndex, setMonthIndex] = useState(10);
  const [field, setField] = useState("all");
  const [language, setLanguage] = useState("all");

  const fields = useMemo(
    () => [...new Set(projects.map((project) => project.zone))].sort(),
    [projects],
  );
  const languages = useMemo(
    () =>
      [...new Set(projects.map((project) => project.language).filter(Boolean))]
        .sort(),
    [projects],
  );
  const rows = useMemo(
    () =>
      projects
        .map((project) => ({
          project,
          openrank:
            project.trend[monthIndex] ??
            (monthIndex === 10 ? project.openrank : null),
        }))
        .filter(
          (row) =>
            (field === "all" || row.project.zone === field) &&
            (language === "all" || row.project.language === language),
        )
        .sort(
          (left, right) =>
            (right.openrank ?? Number.NEGATIVE_INFINITY) -
              (left.openrank ?? Number.NEGATIVE_INFINITY) ||
            left.project.name.localeCompare(right.project.name),
        ),
    [field, language, monthIndex, projects],
  );
  const activeMonth =
    RANKING_MONTHS.find((month) => month.index === monthIndex)?.label ??
    "Jun 2026";

  return (
    <section className={styles.projectRanking} id="project-ranking">
      <header className={styles.rankingHeader}>
        <div>
          <h2>Project ranking</h2>
          <span>
            {rows.length} projects · {activeMonth}
          </span>
        </div>

        <div className={styles.rankingFilters}>
          <label>
            <span>Field</span>
            <select
              value={field}
              onChange={(event) => setField(event.target.value)}
            >
              <option value="all">All fields</option>
              {fields.map((option) => (
                <option key={option} value={option}>
                  {option.replace(" · ", " / ")}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Month</span>
            <select
              value={monthIndex}
              onChange={(event) => setMonthIndex(Number(event.target.value))}
            >
              {[...RANKING_MONTHS].reverse().map((month) => (
                <option key={month.index} value={month.index}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Language</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="all">All languages</option>
              {languages.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className={styles.rankingTableFrame}>
        <table className={styles.rankingTable}>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Project</th>
              <th scope="col">Field</th>
              <th scope="col">Layer</th>
              <th scope="col">Language</th>
              <th scope="col">OpenRank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project, openrank }, index) => (
              <tr
                key={project.repo}
                data-layer={project.stage === "model" ? "model" : "agent"}
              >
                <td>{index + 1}</td>
                <td>
                  <button type="button" onClick={() => onSelect(project.repo)}>
                    <Image
                      src={projectLogoUrl(project.owner)}
                      width={34}
                      height={34}
                      unoptimized
                      alt=""
                    />
                    <span>
                      <strong>{project.name}</strong>
                      <small>{project.repo}</small>
                    </span>
                  </button>
                </td>
                <td>{project.zone.replace(" · ", " / ")}</td>
                <td>{projectLayer(project)}</td>
                <td>{project.language || "—"}</td>
                <td>
                  {openrank === null ? "—" : NUMBER_FORMAT.format(openrank)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
