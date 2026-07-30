import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES } from "./app/[lang]/dictionaries";

/**
 * Locale redirect for the [lang] segment.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`; the function
 * must be named `proxy` too. See node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/proxy.md.
 *
 * The docs reach for `negotiator` + `@formatjs/intl-localematcher` here. The
 * quality-weight parse below is all we need for two locales, and keeping it
 * inline avoids two dependencies on a path that runs for every request.
 */

function preferredLocale(header: string | null) {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    // Match the base language so zh-CN, zh-Hans and zh all resolve to "zh".
    const base = tag.split("-")[0];
    const hit = LOCALES.find((locale) => locale === tag || locale === base);
    if (hit) return hit;
  }

  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return;

  const locale = preferredLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  // 307 keeps the method and, unlike a permanent redirect, is not cached by
  // browsers — a visitor whose language preference changes is re-negotiated.
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: [
    // Everything except API routes, Next internals, and files with an
    // extension (favicon.ico, icon.svg, /fonts/*.woff2, /logos/*.png ...).
    "/((?!api|_next/static|_next/image|.*\\.).*)",
  ],
};
