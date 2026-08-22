"use client";

/**
 * Active locale + the `t()` every component reads its strings through.
 *
 * ── Why the first render is always English ──────────────────────────────────────────
 *
 * The server cannot know a visitor's stored locale, so reading `localStorage` during
 * render would produce different markup on the server and the client — a hydration
 * mismatch across every string on the page. The theme gets around this with a pre-paint
 * inline script because a theme is one class on `<html>`; a locale is the text itself,
 * and there is no equivalent trick short of moving the locale into the URL.
 *
 * So: the server renders the default and the client corrects it. That is exactly what
 * `useSyncExternalStore` exists for, and it is why the preference is held in a module
 * store rather than in component state — the same shape `lib/theme.ts` uses for the
 * theme, for the same reason.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  LOCALE_TAGS,
  formatBand,
  formatDate,
  formatDateTime,
  formatNumber,
  getLocaleSnapshot,
  getServerLocaleSnapshot,
  setStoredLocale,
  subscribeToLocale,
  translate,
  type Interpolations,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: MessageKey, values?: Interpolations) => string;
  formatBand: (band: number) => string;
  formatNumber: (value: number) => string;
  formatDate: (iso: string) => string;
  formatDateTime: (iso: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  const setLocale = useCallback((next: Locale) => {
    // The store also writes `<html lang>`, so assistive technology follows the choice
    // rather than staying at the document's authored language.
    setStoredLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setStoredLocale(getLocaleSnapshot() === "en" ? "vi" : "en");
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: (key, values) => translate(locale, key, values),
      formatBand,
      formatNumber: (n) => formatNumber(n, locale),
      formatDate: (iso) => formatDate(iso, locale),
      formatDateTime: (iso) => formatDateTime(iso, locale),
    }),
    [locale, setLocale, toggleLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

/** Shorthand for the common case: a component that only needs strings. */
export function useT(): LocaleContextValue["t"] {
  return useLocale().t;
}

export { LOCALE_TAGS };
