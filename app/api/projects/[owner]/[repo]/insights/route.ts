import { getLandscapeProjects } from "@/lib/landscape-data";
import { getProjectInsightsForWeb } from "@/lib/server/insights-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectInsightsRouteContext = {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
};

export async function GET(
  _request: Request,
  context: ProjectInsightsRouteContext,
) {
  const { owner, repo } = await context.params;
  const requestedRepo = `${owner}/${repo}`;
  const project = getLandscapeProjects().find(
    (candidate) => candidate.repo.toLowerCase() === requestedRepo.toLowerCase(),
  );

  if (!project) {
    return Response.json(
      { error: "Project is not part of this landscape" },
      {
        status: 404,
        headers: { "X-Content-Type-Options": "nosniff" },
      },
    );
  }

  try {
    const insights = await getProjectInsightsForWeb(project.repo);
    return Response.json(insights, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Project insights are temporarily unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
