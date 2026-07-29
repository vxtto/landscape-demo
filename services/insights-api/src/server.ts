import { randomUUID } from "node:crypto";

import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, {
  type FastifyReply,
  type FastifyRequest,
  type FastifyServerOptions,
} from "fastify";

import { getLandscapeRepositories } from "../../../lib/landscape-data.js";
import type { ProjectInsights } from "../../../lib/project-insights-types.js";

import { hasValidBearerToken } from "./auth.js";
import { TtlCache } from "./cache.js";
import type { ServiceConfig } from "./config.js";

type ProjectParams = {
  owner: string;
  repo: string;
};

export type InsightsLoader = (repo: string) => Promise<ProjectInsights>;

const REPOSITORY_SEGMENT_PATTERN = "^[A-Za-z0-9_.-]{1,100}$";

function authenticationHook(config: ServiceConfig) {
  return async function requireServiceToken(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    if (
      hasValidBearerToken(request.headers.authorization, config.apiTokens)
    ) {
      return;
    }

    reply.header("WWW-Authenticate", 'Bearer realm="landscape-insights"');
    return reply.code(401).send({ error: "Unauthorized" });
  };
}

export async function buildServer(
  config: ServiceConfig,
  getInsights: InsightsLoader,
) {
  const fastifyOptions: FastifyServerOptions = {
    logger: {
      level: config.nodeEnv === "production" ? "info" : "warn",
      redact: {
        paths: [
          "req.headers.authorization",
          "request.headers.authorization",
          "headers.authorization",
        ],
        censor: "[REDACTED]",
      },
    },
    trustProxy: config.trustProxy,
    bodyLimit: 1_024,
    requestTimeout: 25_000,
    connectionTimeout: 10_000,
    requestIdHeader: false,
    genReqId: () => randomUUID(),
  };
  const app = Fastify(fastifyOptions);
  const allowedRepositories = new Map(
    getLandscapeRepositories().map((repo) => [repo.toLowerCase(), repo]),
  );
  const cache = new TtlCache<ProjectInsights>(
    config.cacheTtlMs,
    config.cacheMaxEntries,
  );

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  await app.register(rateLimit, {
    global: true,
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
    allowList: ["127.0.0.1", "::1"],
  });

  app.setErrorHandler((error, request, reply) => {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    request.log.error(
      { errorName, requestId: request.id },
      "request failed",
    );
    void reply.code(500).send({ error: "Internal server error" });
  });

  app.get("/healthz", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return { status: "ok" };
  });

  app.get<{ Params: ProjectParams }>(
    "/v1/projects/:owner/:repo/insights",
    {
      preHandler: authenticationHook(config),
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["owner", "repo"],
          properties: {
            owner: {
              type: "string",
              pattern: REPOSITORY_SEGMENT_PATTERN,
            },
            repo: {
              type: "string",
              pattern: REPOSITORY_SEGMENT_PATTERN,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const requestedRepo =
        `${request.params.owner}/${request.params.repo}`.toLowerCase();
      const canonicalRepo = allowedRepositories.get(requestedRepo);

      reply.header("Cache-Control", "private, no-store");

      if (!canonicalRepo) {
        return reply.code(404).send({
          error: "Project is not part of this landscape",
        });
      }

      try {
        const result = await cache.getOrLoad(canonicalRepo, () =>
          getInsights(canonicalRepo),
        );
        reply.header("X-Insights-Cache", result.cacheStatus);
        return result.value;
      } catch {
        request.log.error(
          { repo: canonicalRepo, requestId: request.id },
          "project insights query failed",
        );
        return reply.code(503).send({
          error: "Project insights are temporarily unavailable",
        });
      }
    },
  );

  return app;
}
