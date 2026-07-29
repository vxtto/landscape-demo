import assert from "node:assert/strict";
import test from "node:test";

import type { ProjectInsights } from "../../../lib/project-insights-types.js";

import type { ServiceConfig } from "./config.js";
import { buildServer } from "./server.js";

const TEST_TOKEN = "test-token-that-is-longer-than-thirty-two-characters";

const config: ServiceConfig = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 8080,
  apiTokens: [TEST_TOKEN],
  trustProxy: false,
  cacheTtlMs: 60_000,
  cacheMaxEntries: 10,
  rateLimitMax: 100,
  rateLimitWindow: "1 minute",
  clickhouse: {
    endpoint: new URL("https://clickhouse.invalid:8443"),
    user: "unused",
    password: "unused",
    allowPrivateHttp: false,
  },
  githubToken: null,
};

const fixture: ProjectInsights = {
  repo: "openai/codex",
  dataYear: 2026,
  generatedAt: "2026-07-27T00:00:00.000Z",
  metrics: {
    openrank: 100,
    openrankMonth: "2026-06",
    stars: 1000,
    starsUpdatedAt: "2026-07-27T00:00:00.000Z",
    participants: 50,
    participantsMonth: "2026-06",
    language: "Rust",
  },
  trends: [],
  arena: {
    month: "2026-06",
    totalOpenrank: 0,
    contributors: [],
  },
};

test("health check does not require credentials", async () => {
  const app = await buildServer(config, async () => fixture);
  const response = await app.inject({ method: "GET", url: "/healthz" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok" });
  await app.close();
});

test("insights reject missing and invalid credentials", async () => {
  const app = await buildServer(config, async () => fixture);

  const missing = await app.inject({
    method: "GET",
    url: "/v1/projects/openai/codex/insights",
  });
  const invalid = await app.inject({
    method: "GET",
    url: "/v1/projects/openai/codex/insights",
    headers: { authorization: "Bearer wrong-token" },
  });

  assert.equal(missing.statusCode, 401);
  assert.equal(invalid.statusCode, 401);
  assert.deepEqual(missing.json(), { error: "Unauthorized" });
  await app.close();
});

test("insights only serve allowlisted repositories", async () => {
  const app = await buildServer(config, async () => fixture);
  const response = await app.inject({
    method: "GET",
    url: "/v1/projects/not/allowed/insights",
    headers: { authorization: `Bearer ${TEST_TOKEN}` },
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    error: "Project is not part of this landscape",
  });
  await app.close();
});

test("insights return public data and coalesce cache reads", async () => {
  let calls = 0;
  const app = await buildServer(config, async () => {
    calls += 1;
    return fixture;
  });
  const request = {
    method: "GET" as const,
    url: "/v1/projects/openai/codex/insights",
    headers: { authorization: `Bearer ${TEST_TOKEN}` },
  };

  const first = await app.inject(request);
  const second = await app.inject(request);

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(first.headers["x-insights-cache"], "miss");
  assert.equal(second.headers["x-insights-cache"], "hit");
  assert.equal(calls, 1);
  assert.deepEqual(first.json(), fixture);
  await app.close();
});

test("query failures return a sanitized error", async () => {
  const app = await buildServer(config, async () => {
    throw new Error(
      "database password=should-never-appear host=private.internal",
    );
  });
  const response = await app.inject({
    method: "GET",
    url: "/v1/projects/openai/codex/insights",
    headers: { authorization: `Bearer ${TEST_TOKEN}` },
  });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), {
    error: "Project insights are temporarily unavailable",
  });
  assert.equal(response.body.includes("should-never-appear"), false);
  assert.equal(response.body.includes("private.internal"), false);
  await app.close();
});
