import { getLandscapeRepositories } from "@/lib/landscape-data";

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

  const response = await fetch(
    `https://github.com/${encodeURIComponent(owner)}.png?size=160`,
    {
      cache: "force-cache",
      next: { revalidate: 86_400 },
      redirect: "follow",
    },
  );

  if (!response.ok) {
    return new Response("Project logo unavailable", { status: 502 });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Type": response.headers.get("content-type") ?? "image/png",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
