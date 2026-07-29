import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSafeClickHouseTransport,
  loadConfig,
  type ServiceConfig,
} from "./config.js";

const VALID_TOKEN = "test-token-that-is-longer-than-thirty-two-characters";

function environment(
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    INSIGHTS_API_TOKEN: VALID_TOKEN,
    CLICKHOUSE_URL: "https://clickhouse.example:8443",
    CLICKHOUSE_USER: "readonly",
    CLICKHOUSE_PASSWORD: "secret",
    ...overrides,
  };
}

test("configuration requires a sufficiently long API token", () => {
  assert.throws(
    () => loadConfig(environment({ INSIGHTS_API_TOKEN: "short" })),
    /at least 32 characters/,
  );
});

test("HTTPS ClickHouse transport is accepted", async () => {
  const config = loadConfig(environment());
  await assert.doesNotReject(() => assertSafeClickHouseTransport(config));
});

test("ClickHouse URL defaults to the secure HTTP interface port", () => {
  const config = loadConfig(
    environment({ CLICKHOUSE_URL: "https://clickhouse.example" }),
  );
  assert.equal(config.clickhouse.endpoint.port, "8443");
});

test("ClickHouse URL cannot embed credentials", () => {
  assert.throws(
    () =>
      loadConfig(
        environment({
          CLICKHOUSE_URL: "https://user:password@clickhouse.example:8443",
        }),
      ),
    /dedicated environment variables/,
  );
});

test("private HTTP must be explicitly enabled", async () => {
  const config = loadConfig(
    environment({
      CLICKHOUSE_URL: "http://127.0.0.1:8123",
      CLICKHOUSE_ALLOW_PRIVATE_HTTP: "false",
    }),
  );

  await assert.rejects(
    () => assertSafeClickHouseTransport(config),
    /Cleartext ClickHouse transport is disabled/,
  );
});

test("explicit HTTP is accepted only for private addresses", async () => {
  const privateConfig = loadConfig(
    environment({
      CLICKHOUSE_URL: "http://127.0.0.1:8123",
      CLICKHOUSE_ALLOW_PRIVATE_HTTP: "true",
    }),
  );
  const publicConfig: ServiceConfig = {
    ...privateConfig,
    clickhouse: {
      ...privateConfig.clickhouse,
      endpoint: new URL("http://8.8.8.8:8123"),
    },
  };

  await assert.doesNotReject(() =>
    assertSafeClickHouseTransport(privateConfig),
  );
  await assert.rejects(
    () => assertSafeClickHouseTransport(publicConfig),
    /only allowed for private network addresses/,
  );
});
