"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./locale-switch.module.css";
import type { Locale } from "./dictionaries";

/**
 * Swaps the leading locale segment while keeping the rest of the path, so
 * switching language on /zh/keynote lands on /en/keynote rather than home.
 *
 * Locale names are endonyms on purpose — a reader who cannot read the current
 * language still has to recognise their own.
 */
export default function LocaleSwitch({
  locales,
  current,
  label,
  names,
}: {
  locales: Locale[];
  current: Locale;
  label: string;
  names: Record<string, string>;
}) {
  const pathname = usePathname();
  const rest = pathname.replace(new RegExp(`^/(?:${locales.join("|")})`), "");

  return (
    <div className={styles.localeSwitch} role="group" aria-label={label}>
      {locales.map((locale) =>
        locale === current ? (
          <span key={locale} aria-current="true">
            {names[locale] ?? locale}
          </span>
        ) : (
          <Link key={locale} href={`/${locale}${rest}`} hrefLang={locale}>
            {names[locale] ?? locale}
          </Link>
        ),
      )}
    </div>
  );
}
