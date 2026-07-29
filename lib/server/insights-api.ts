import "server-only";

import type { ProjectInsights } from "@/lib/project-insights-types";

const MINIMUM_TOKEN_LENGTH = 32;
const MAXIMUM_RESPONSE_BYTES = 2_000_000;

function getRemoteConfig() {
  const configuredUrl = process.env.INSIGHTS_API_URL;
  const token = process.env.INSIGHTS_API_TOKEN;

  if (!configuredUrl && !token) return null;
  if (!configuredUrl || !token) {
    throw new Error("Insights API configuration is incomplete");
  }
  if (token.length < MINIMUM_TOKEN_LENGTH) {
    throw new Error("Insights API token is too short");
  }

  const baseUrl = new URL(configuredUrl);
  if (baseUrl.username || baseUrl.password) {
    throw new Error("Insights API URL must not contain credentials");
  }
  if (
    process.env.NODE_ENV === "production" &&
    baseUrl.protocol !== "https:"
  ) {
    throw new Error("Insights API must use HTTPS in production");
  }
  if (!["http:", "https:"].includes(baseUrl.protocol)) {
    throw new Error("Insights API URL must use HTTP or HTTPS");
  }

  return { baseUrl, token };
}

function isProjectInsights(
  value: unknown,
  expectedRepo: string,
): value is ProjectInsights {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProjectInsights>;

  return (
    typeof candidate.repo === "string" &&
    candidate.repo.toLowerCase() === expectedRepo.toLowerCase() &&
    typeof candidate.dataYear === "number" &&
    typeof candidate.generatedAt === "string" &&
    Boolean(candidate.metrics && typeof candidate.metrics === "object") &&
    Array.isArray(candidate.trends) &&
    Boolean(candidate.arena && typeof candidate.arena === "object") &&
    Array.isArray(candidate.arena?.contributors)
  );
}

async function fetchRemoteProjectInsights(
  repo: string,
  config: NonNullable<ReturnType<typeof getRemoteConfig>>,
) {
  const [owner, repoName] = repo.split("/");
  const endpoint = new URL(config.baseUrl);
  const basePath = endpoint.pathname.replace(/\/$/, "");
  endpoint.pathname = `${basePath}/v1/projects/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/insights`;
  endpoint.search = "";
  endpoint.hash = "";

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    throw new Error(`Insights API returned status ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAXIMUM_RESPONSE_BYTES) {
    throw new Error("Insights API response is too large");
  }

  const body = await response.text();
  if (Buffer.byteLength(body, "utf8") > MAXIMUM_RESPONSE_BYTES) {
    throw new Error("Insights API response is too large");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error("Insights API returned invalid JSON");
  }

  if (!isProjectInsights(payload, repo)) {
    throw new Error("Insights API returned an invalid response");
  }

  return payload;
}

export async function getProjectInsightsForWeb(repo: string) {
  const remoteConfig = getRemoteConfig();

  if (remoteConfig) {
    return fetchRemoteProjectInsights(repo, remoteConfig);
  }

  if (process.env.NODE_ENV !== "production") {
    const { getProjectInsights } = await import("./project-insights");
    return getProjectInsights(repo);
  }

  throw new Error("Insights API is not configured");
}
