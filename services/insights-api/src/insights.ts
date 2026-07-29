import type {
  ContributorTrendPoint,
  ProjectContributor,
  ProjectInsights,
  ProjectTrendPoint,
} from "../../../lib/project-insights-types.js";

import type { ClickHouseQuery } from "./clickhouse.js";

const PLATFORM = "GitHub";

type LatestMonthRow = {
  openrank_month: number;
  participants_month: number;
};

type OpenRankTrendRow = {
  month: number;
  openrank: number;
};

type ParticipantsTrendRow = {
  month: number;
  participants: number;
};

type ContributorRow = {
  actor_id: string;
  actor_login: string;
  openrank: number;
  total_openrank: number;
  name: string;
  company: string;
  location: string;
  bio: string;
};

type ContributorTrendRow = {
  actor_id: string;
  month: number;
  openrank: number;
};

type GitHubRepository = {
  stargazers_count?: number;
  language?: string | null;
  updated_at?: string;
};

function finiteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthKey(value: number) {
  if (!value) return null;
  const source = String(value);
  return `${source.slice(0, 4)}-${source.slice(4, 6)}`;
}

function monthLabel(value: number) {
  const key = monthKey(value);
  if (!key) return "—";
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function nullableText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maximumLength) : null;
}

async function fetchRepositorySnapshot(
  repo: string,
  githubToken: string | null,
) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "agent-infra-landscape-insights",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return null;
    return (await response.json()) as GitHubRepository;
  } catch {
    return null;
  }
}

export function createProjectInsightsService(
  queryClickHouse: ClickHouseQuery,
  githubToken: string | null,
) {
  return async function getProjectInsights(
    repo: string,
  ): Promise<ProjectInsights> {
    const parameters = {
      platform: PLATFORM,
      repo: repo.toLowerCase(),
    };

    const [latest] = await queryClickHouse<LatestMonthRow>(
      `
        SELECT
          (
            SELECT max(toYYYYMM(created_at))
            FROM opensource.global_openrank
            WHERE platform = {platform:String}
              AND lower(repo_name) = {repo:String}
              AND type = 'Repo'
          ) AS openrank_month,
          (
            SELECT max(yyyymm)
            FROM opensource.normalized_community_openrank
            WHERE platform = {platform:String}
              AND lower(repo_name) = {repo:String}
          ) AS participants_month
      `,
      parameters,
    );

    const openrankMonth = finiteNumber(latest?.openrank_month);
    const participantsMonth = finiteNumber(latest?.participants_month);
    const latestAvailableMonth = Math.max(openrankMonth, participantsMonth);
    const dataYear =
      Math.floor(latestAvailableMonth / 100) || new Date().getUTCFullYear();

    const [
      openrankTrendRows,
      participantsTrendRows,
      contributorRows,
      contributorTrendRows,
      repositorySnapshot,
    ] = await Promise.all([
      queryClickHouse<OpenRankTrendRow>(
        `
          SELECT
            toYYYYMM(created_at) AS month,
            round(argMax(openrank, created_at), 2) AS openrank
          FROM opensource.global_openrank
          WHERE platform = {platform:String}
            AND lower(repo_name) = {repo:String}
            AND type = 'Repo'
            AND toYear(created_at) = {year:UInt16}
          GROUP BY month
          ORDER BY month
        `,
        { ...parameters, year: dataYear },
      ),
      queryClickHouse<ParticipantsTrendRow>(
        `
          SELECT
            yyyymm AS month,
            uniqExact(actor_id) AS participants
          FROM opensource.normalized_community_openrank
          WHERE platform = {platform:String}
            AND lower(repo_name) = {repo:String}
            AND intDiv(yyyymm, 100) = {year:UInt16}
          GROUP BY month
          ORDER BY month
        `,
        { ...parameters, year: dataYear },
      ),
      participantsMonth
        ? queryClickHouse<ContributorRow>(
            `
              WITH ranked AS (
                SELECT
                  actor_id,
                  any(actor_login) AS actor_login,
                  round(max(openrank), 2) AS openrank
                FROM opensource.normalized_community_openrank
                WHERE platform = {platform:String}
                  AND lower(repo_name) = {repo:String}
                  AND yyyymm = {month:UInt32}
                GROUP BY actor_id
              ),
              totals AS (
                SELECT round(sum(openrank), 2) AS total_openrank
                FROM ranked
              )
              SELECT
                toString(r.actor_id) AS actor_id,
                r.actor_login,
                r.openrank,
                totals.total_openrank,
                anyIf(u.name, u.name != '') AS name,
                anyIf(u.company, u.company != '') AS company,
                anyIf(u.location, u.location != '') AS location,
                anyIf(u.bio, u.bio != '') AS bio
              FROM ranked AS r
              CROSS JOIN totals
              LEFT JOIN opensource.user_info AS u
                ON u.platform = {platform:String}
                AND u.id = r.actor_id
              GROUP BY
                r.actor_id,
                r.actor_login,
                r.openrank,
                totals.total_openrank
              ORDER BY r.openrank DESC, r.actor_login
              LIMIT 12
            `,
            { ...parameters, month: participantsMonth },
          )
        : Promise.resolve([]),
      participantsMonth
        ? queryClickHouse<ContributorTrendRow>(
            `
              WITH top_contributors AS (
                SELECT actor_id
                FROM opensource.normalized_community_openrank
                WHERE platform = {platform:String}
                  AND lower(repo_name) = {repo:String}
                  AND yyyymm = {month:UInt32}
                GROUP BY actor_id
                ORDER BY max(openrank) DESC
                LIMIT 12
              )
              SELECT
                toString(n.actor_id) AS actor_id,
                n.yyyymm AS month,
                round(max(n.openrank), 2) AS openrank
              FROM opensource.normalized_community_openrank AS n
              INNER JOIN top_contributors AS top
                ON top.actor_id = n.actor_id
              WHERE n.platform = {platform:String}
                AND lower(n.repo_name) = {repo:String}
                AND intDiv(n.yyyymm, 100) = {year:UInt16}
              GROUP BY n.actor_id, n.yyyymm
              ORDER BY n.actor_id, n.yyyymm
            `,
            { ...parameters, month: participantsMonth, year: dataYear },
          )
        : Promise.resolve([]),
      fetchRepositorySnapshot(repo, githubToken),
    ]);

    const openrankByMonth = new Map(
      openrankTrendRows.map((row) => [
        finiteNumber(row.month),
        finiteNumber(row.openrank),
      ]),
    );
    const participantsByMonth = new Map(
      participantsTrendRows.map((row) => [
        finiteNumber(row.month),
        finiteNumber(row.participants),
      ]),
    );
    const trendMonths = new Set([
      ...openrankByMonth.keys(),
      ...participantsByMonth.keys(),
    ]);
    const trends: ProjectTrendPoint[] = [...trendMonths]
      .filter(Boolean)
      .sort((a, b) => a - b)
      .map((month) => ({
        month: monthKey(month) ?? String(month),
        monthLabel: monthLabel(month),
        openrank: openrankByMonth.get(month) ?? null,
        participants: participantsByMonth.get(month) ?? null,
      }));

    const contributorTrends = new Map<string, ContributorTrendPoint[]>();
    contributorTrendRows.forEach((row) => {
      const actorId = String(row.actor_id);
      const month = finiteNumber(row.month);
      if (!month) return;
      const current = contributorTrends.get(actorId) ?? [];
      current.push({
        month: monthKey(month) ?? String(month),
        monthLabel: monthLabel(month),
        openrank: finiteNumber(row.openrank),
      });
      contributorTrends.set(actorId, current);
    });

    const totalArenaOpenrank = finiteNumber(
      contributorRows[0]?.total_openrank,
    );
    const contributors: ProjectContributor[] = contributorRows.map(
      (row, index) => {
        const actorId = String(row.actor_id);
        const login =
          nullableText(row.actor_login, 100) || `actor-${actorId.slice(0, 32)}`;
        const openrank = finiteNumber(row.openrank);

        return {
          rank: index + 1,
          id: actorId.slice(0, 128),
          login,
          name: nullableText(row.name, 160),
          avatarUrl: `https://github.com/${encodeURIComponent(login)}.png?size=128`,
          openrank,
          share:
            totalArenaOpenrank > 0
              ? Number(((openrank / totalArenaOpenrank) * 100).toFixed(2))
              : 0,
          company: nullableText(row.company, 160),
          location: nullableText(row.location, 160),
          bio: nullableText(row.bio, 500),
          trend: contributorTrends.get(actorId) ?? [],
        };
      },
    );

    const latestOpenrank =
      openrankByMonth.get(openrankMonth) ??
      openrankTrendRows.at(-1)?.openrank ??
      null;
    const latestParticipants =
      participantsByMonth.get(participantsMonth) ??
      participantsTrendRows.at(-1)?.participants ??
      null;

    return {
      repo,
      dataYear,
      generatedAt: new Date().toISOString(),
      metrics: {
        openrank:
          latestOpenrank === null || latestOpenrank === undefined
            ? null
            : finiteNumber(latestOpenrank),
        openrankMonth: monthKey(openrankMonth),
        stars:
          typeof repositorySnapshot?.stargazers_count === "number"
            ? repositorySnapshot.stargazers_count
            : null,
        starsUpdatedAt: repositorySnapshot?.updated_at ?? null,
        participants:
          latestParticipants === null || latestParticipants === undefined
            ? null
            : finiteNumber(latestParticipants),
        participantsMonth: monthKey(participantsMonth),
        language: nullableText(repositorySnapshot?.language, 100),
      },
      trends,
      arena: {
        month: monthKey(participantsMonth),
        totalOpenrank: totalArenaOpenrank,
        contributors,
      },
    };
  };
}
