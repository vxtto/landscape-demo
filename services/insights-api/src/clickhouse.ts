import { Buffer } from "node:buffer";

import type { ServiceConfig } from "./config.js";

type ClickHouseParameter = string | number;

export type ClickHouseQuery = <T>(
  sql: string,
  parameters?: Record<string, ClickHouseParameter>,
) => Promise<T[]>;

export function createClickHouseQuery(config: ServiceConfig): ClickHouseQuery {
  const authorization = `Basic ${Buffer.from(
    `${config.clickhouse.user}:${config.clickhouse.password}`,
  ).toString("base64")}`;

  return async function queryClickHouse<T>(
    sql: string,
    parameters: Record<string, ClickHouseParameter> = {},
  ) {
    const endpoint = new URL(config.clickhouse.endpoint);
    endpoint.pathname = "/";
    endpoint.search = "";
    endpoint.searchParams.set("database", "opensource");
    endpoint.searchParams.set("default_format", "JSONEachRow");
    endpoint.searchParams.set("readonly", "1");
    endpoint.searchParams.set("max_execution_time", "15");
    endpoint.searchParams.set("max_result_rows", "2000");
    endpoint.searchParams.set("result_overflow_mode", "break");

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
      redirect: "error",
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
  };
}
