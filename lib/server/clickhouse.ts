import { Buffer } from "node:buffer";

import "server-only";

type ClickHouseParameter = string | number;

function getClickHouseEndpoint() {
  const configuredUrl = process.env.CLICKHOUSE_URL;
  const host = process.env.CLICKHOUSE_HOST;
  const user = process.env.CLICKHOUSE_USER;
  const password = process.env.CLICKHOUSE_PASSWORD;

  if ((!configuredUrl && !host) || !user || !password) {
    throw new Error("ClickHouse is not configured");
  }

  const protocol = process.env.CLICKHOUSE_PROTOCOL || "http";
  const endpoint = new URL(
    configuredUrl ||
      (/^https?:\/\//i.test(host!)
        ? host!
        : `${protocol}://${host!}`),
  );

  if (
    process.env.NODE_ENV === "production" &&
    endpoint.protocol !== "https:"
  ) {
    throw new Error("Secure ClickHouse transport is required in production");
  }

  if (!endpoint.port) {
    endpoint.port =
      process.env.CLICKHOUSE_PORT ||
      (endpoint.protocol === "https:" ? "8443" : "8123");
  }

  endpoint.pathname = "/";
  endpoint.search = "";
  endpoint.searchParams.set("database", "opensource");
  endpoint.searchParams.set("default_format", "JSONEachRow");
  endpoint.searchParams.set("readonly", "1");
  endpoint.searchParams.set("max_execution_time", "15");
  endpoint.searchParams.set("max_result_rows", "2000");
  endpoint.searchParams.set("result_overflow_mode", "break");

  return {
    endpoint,
    authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
  };
}

export async function queryClickHouse<T>(
  sql: string,
  parameters: Record<string, ClickHouseParameter> = {},
) {
  const { endpoint, authorization } = getClickHouseEndpoint();

  Object.entries(parameters).forEach(([key, value]) => {
    endpoint.searchParams.set(`param_${key}`, String(value));
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: `${sql.trim()}\nFORMAT JSONEachRow`,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`ClickHouse request failed with status ${response.status}`);
  }

  const payload = await response.text();
  if (!payload.trim()) return [];

  try {
    return payload
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch {
    throw new Error("ClickHouse returned an invalid response");
  }
}
