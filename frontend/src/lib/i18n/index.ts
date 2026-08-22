/**
 * Locale preference and message lookup.
 *
 * Deliberately not locale-routed. The alternative — `/vi/workspace`, `/en/workspace` —
 * doubles every route the SC-005 navigation audit has to walk and turns a preference
 * into a navigation event, which would lose an in-progress essay on every switch. The
 * locale is a preference, held like the theme is: one value in `localStorage`, applied
 * to the running page.
 *
 * `localStorage` access is guarded everywhere, for the same reason `theme.ts` guards it:
 * Safari's private mode throws on access, and losing a cosmetic preference is acceptable
 * where taking the page down with it is not.
 */

import { en, type MessageKey, type Messages } from "./en";
import { vi } from "./vi";

export type Locale = "en" | "vi";

export const LOCALES: Locale[] = ["en", "vi"];

export const STORAGE_KEY = "writewise.locale";

export const DEFAULT_LOCALE: Locale = "en";

const CATALOGUES: Record<Locale, Messages> = { en, vi };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "vi";
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // The preference will not survive a reload; this page still renders correctly.
  }
}

/* ── External-store interface for `useSyncExternalStore` ────────────────────────────
 *
 * The locale is a browser-global preference, not component state: it outlives any one
 * tree, it is read from storage the client owns, and the server cannot know it. Holding
 * it here and subscribing from React avoids the cascading render an "adopt the stored
 * value in an effect" implementation causes, and keeps every consumer on one value.
 */

let current: Locale | null = null;
const listeners = new Set<() => void>();

export function getLocaleSnapshot(): Locale {
  if (current === null) current = readStoredLocale();
  return current;
}

/** The server has no visitor to read a preference from; it renders the default. */
export function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setStoredLocale(locale: Locale): void {
  current = locale;
  writeStoredLocale(locale);
  if (typeof document !== "undefined") {
    document.documentElement.lang = LOCALE_TAGS[locale];
  }
  for (const listener of listeners) listener();
}

/** Test seam: forget the cached value so a suite can start from storage again. */
export function resetLocaleCache(): void {
  current = null;
}

export function catalogue(locale: Locale): Messages {
  return CATALOGUES[locale] ?? CATALOGUES[DEFAULT_LOCALE];
}

export type Interpolations = Record<string, string | number>;

/**
 * Fill `{name}` placeholders.
 *
 * An unmatched placeholder is left in place rather than blanked: a visible `{count}` in
 * the UI is a bug someone reports, where a silently empty string is a bug nobody sees.
 */
export function interpolate(template: string, values?: Interpolations): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  values?: Interpolations,
): string {
  return interpolate(catalogue(locale)[key], values);
}

/** BCP 47 tags, for `<html lang>` and the platform formatters. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en",
  vi: "vi-VN",
};

/** IELTS reports one decimal place — "7" reads as a different, vaguer claim than "7.0". */
export function formatBand(band: number): string {
  return band.toFixed(1);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale]).format(value);
}

export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export { en, vi };
export type { MessageKey, Messages };
