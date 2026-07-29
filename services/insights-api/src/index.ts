import { createClickHouseQuery } from "./clickhouse.js";
import { assertSafeClickHouseTransport, loadConfig } from "./config.js";
import { createProjectInsightsService } from "./insights.js";
import { buildServer } from "./server.js";

async function main() {
  const config = loadConfig();
  await assertSafeClickHouseTransport(config);

  const queryClickHouse = createClickHouseQuery(config);
  const getInsights = createProjectInsightsService(
    queryClickHouse,
    config.githubToken,
  );
  const app = await buildServer(config, getInsights);

  const close = async () => {
    await app.close();
    process.exit(0);
  };

  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());

  await app.listen({
    host: config.host,
    port: config.port,
  });
}

main().catch((error: unknown) => {
  const name = error instanceof Error ? error.name : "UnknownError";
  console.error(`Insights API failed to start (${name})`);
  process.exit(1);
});
