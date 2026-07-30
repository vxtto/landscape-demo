import "server-only";

/**
 * Locale dictionaries.
 *
 * The site is bilingual in an uneven way: the landscape UI is authored in
 * English, the CommunityOverCode keynote is authored in Chinese. Neither has
 * been translated yet, so every key carries a `sourceLocale` and lookups fall
 * back to it rather than rendering an empty string. A visitor on /en/keynote
 * therefore reads the Chinese original instead of a blank page, until a human
 * translation lands.
 *
 * See `dictionaries/README.md` for what still needs translating.
 */

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  zh: () => import("./dictionaries/zh.json").then((module) => module.default),
} as const;

export type Locale = keyof typeof dictionaries;

export const LOCALES = Object.keys(dictionaries) as Locale[];

export const DEFAULT_LOCALE: Locale = "en";

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

/**
 * Deep-merge the requested locale over the default one so a key that has not
 * been translated yet resolves to its authored text instead of `undefined`.
 */
function withFallback<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (
    typeof base !== "object" ||
    base === null ||
    Array.isArray(base) ||
    typeof override !== "object" ||
    Array.isArray(override)
  ) {
    return override as T;
  }

  const merged: Record<string, unknown> = { ...(base as object) };
  for (const [key, value] of Object.entries(override as object)) {
    merged[key] = withFallback(
      (base as Record<string, unknown>)[key],
      value,
    );
  }

  return merged as T;
}

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const fallback = await dictionaries[DEFAULT_LOCALE]();
  if (locale === DEFAULT_LOCALE) return fallback;
  return withFallback(fallback, await dictionaries[locale]());
};
