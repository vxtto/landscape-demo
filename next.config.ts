import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/project-logos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=31536000",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=31536000",
          },
        ],
      },
    ];
  },
  images: {
    // The Vercel project's "services" framework routes every path through a
    // rewrite to the frontend service, which doesn't expose the built-in
    // /_next/image optimization endpoint — every <Image> 404s in production.
    // Unoptimized falls back to serving the source file directly, same as
    // the plain <img> logos elsewhere already do.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
