import type { Locale } from "../dictionaries";

/**
 * Keynote-scoped bilingual helper.
 *
 * The keynote surfaces (research page + slide deck) hold a lot of authored
 * copy that lives in plain data modules rather than the dictionary JSON.
 * Each translatable field is written as `{ en, zh }` and resolved with
 * `pick(lang, value)` — mirrors the fallback behaviour in `../dictionaries.ts`
 * without dragging JSON merging into strongly-typed data structures.
 */
export type Localized<T> = { en: T; zh: T };

export function pick<T>(lang: Locale, value: Localized<T>): T {
  return value[lang] ?? value.en;
}

/** Deeply resolve every `Localized<T>` leaf in an object/array tree for `lang`. */
export function resolveDeep<T>(lang: Locale, value: T): unknown {
  if (value && typeof value === "object" && "en" in value && "zh" in value) {
    return (value as unknown as Localized<unknown>)[lang];
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveDeep(lang, item));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = resolveDeep(lang, item);
    }
    return result;
  }
  return value;
}
