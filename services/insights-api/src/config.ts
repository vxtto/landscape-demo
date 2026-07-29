import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const MINIMUM_TOKEN_LENGTH = 32;

function positiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("A positive integer environment value is invalid");
  }
  return parsed;
}

function booleanValue(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error("A boolean environment value must be true or false");
}

function required(value: string | undefined, label: string) {
  if (!value) throw new Error(`${label} is required`);
  return value;
}

function buildClickHouseUrl(environment: NodeJS.ProcessEnv) {
  const configuredUrl = environment.CLICKHOUSE_URL;
  const host = environment.CLICKHOUSE_HOST;

  if (!configuredUrl && !host) {
    throw new Error("CLICKHOUSE_URL or CLICKHOUSE_HOST is required");
  }

  const protocol = environment.CLICKHOUSE_PROTOCOL || "http";
  const endpoint = configuredUrl
    ? new URL(configuredUrl)
    : new URL(
        /^https?:\/\//i.test(host!)
          ? host!
          : `${protocol}://${host!}`,
      );

  if (endpoint.username || endpoint.password) {
    throw new Error(
      "ClickHouse credentials must use dedicated environment variables",
    );
  }

  if (!endpoint.port) {
    endpoint.port =
      environment.CLICKHOUSE_PORT ||
      (endpoint.protocol === "https:" ? "8443" : "8123");
  }

  return endpoint;
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized)
  );
}

function isPrivateAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return false;
}

export type ServiceConfig = {
  nodeEnv: string;
  host: string;
  port: number;
  apiTokens: string[];
  trustProxy: boolean;
  cacheTtlMs: number;
  cacheMaxEntries: number;
  rateLimitMax: number;
  rateLimitWindow: string;
  clickhouse: {
    endpoint: URL;
    user: string;
    password: string;
    allowPrivateHttp: boolean;
  };
  githubToken: string | null;
};

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ServiceConfig {
  const primaryToken = required(
    environment.INSIGHTS_API_TOKEN,
    "INSIGHTS_API_TOKEN",
  );
  const previousToken = environment.INSIGHTS_API_PREVIOUS_TOKEN;
  const apiTokens = [primaryToken, previousToken].filter(
    (value): value is string => Boolean(value),
  );

  if (apiTokens.some((token) => token.length < MINIMUM_TOKEN_LENGTH)) {
    throw new Error(
      `Insights API tokens must contain at least ${MINIMUM_TOKEN_LENGTH} characters`,
    );
  }

  return {
    nodeEnv: environment.NODE_ENV || "development",
    host: environment.HOST || "127.0.0.1",
    port: positiveInteger(environment.PORT, 8080),
    apiTokens,
    trustProxy: booleanValue(environment.INSIGHTS_TRUST_PROXY),
    cacheTtlMs:
      positiveInteger(environment.CACHE_TTL_SECONDS, 86_400) * 1_000,
    cacheMaxEntries: positiveInteger(environment.CACHE_MAX_ENTRIES, 300),
    rateLimitMax: positiveInteger(environment.RATE_LIMIT_MAX, 120),
    rateLimitWindow: environment.RATE_LIMIT_WINDOW || "1 minute",
    clickhouse: {
      endpoint: buildClickHouseUrl(environment),
      user: required(environment.CLICKHOUSE_USER, "CLICKHOUSE_USER"),
      password: required(
        environment.CLICKHOUSE_PASSWORD,
        "CLICKHOUSE_PASSWORD",
      ),
      allowPrivateHttp: booleanValue(
        environment.CLICKHOUSE_ALLOW_PRIVATE_HTTP,
      ),
    },
    githubToken: environment.GITHUB_TOKEN || null,
  };
}

export async function assertSafeClickHouseTransport(config: ServiceConfig) {
  const endpoint = config.clickhouse.endpoint;

  if (endpoint.protocol === "https:") return;
  if (endpoint.protocol !== "http:") {
    throw new Error("ClickHouse must use HTTP or HTTPS");
  }
  if (!config.clickhouse.allowPrivateHttp) {
    throw new Error(
      "Cleartext ClickHouse transport is disabled. Use HTTPS or explicitly allow private HTTP.",
    );
  }

  const hostname = endpoint.hostname;
  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => !isPrivateAddress(address))
  ) {
    throw new Error(
      "Cleartext ClickHouse transport is only allowed for private network addresses",
    );
  }
}
