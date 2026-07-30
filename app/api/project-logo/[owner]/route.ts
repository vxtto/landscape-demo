import { getLandscapeRepositories } from "@/lib/landscape-data";

const CDN_CACHE_SECONDS = 30 * 24 * 60 * 60;
const BROWSER_CACHE_SECONDS = 7 * 24 * 60 * 60;
const STALE_CACHE_SECONDS = 365 * 24 * 60 * 60;

const ALLOWED_OWNERS = new Set(
  getLandscapeRepositories().map(
    (repository) => repository.split("/")[0].toLowerCase(),
  ),
);

export async function GET(
  _request: Request,
  context: { params: Promise<{ owner: string }> },
) {
  const { owner: encodedOwner } = await context.params;
  const owner = decodeURIComponent(encodedOwner).toLowerCase();

  if (!/^[a-z0-9-]+$/.test(owner) || !ALLOWED_OWNERS.has(owner)) {
    return new Response("Unknown landscape project owner", { status: 404 });
  }

  let response: Response;

  try {
    response = await fetch(
      `https://github.com/${encodeURIComponent(owner)}.png?size=160`,
      {
        cache: "force-cache",
        next: { revalidate: CDN_CACHE_SECONDS },
        redirect: "follow",
        signal: AbortSignal.timeout(5_000),
      },
    );
  } catch {
    return new Response("Project logo unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (!response.ok) {
    return new Response("Project logo unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Cache-Control": [
        "public",
        `max-age=${BROWSER_CACHE_SECONDS}`,
        `s-maxage=${CDN_CACHE_SECONDS}`,
        `stale-while-revalidate=${STALE_CACHE_SECONDS}`,
        `stale-if-error=${STALE_CACHE_SECONDS}`,
      ].join(", "),
      "Content-Type": response.headers.get("content-type") ?? "image/png",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
