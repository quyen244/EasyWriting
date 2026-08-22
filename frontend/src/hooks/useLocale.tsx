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
 * So: render the default, then adopt the stored locale in an effect. A Vietnamese
 * visitor sees English for one frame. That is the honest cost of not locale-routing, and
 * it is paid once per page load rather than on every switch.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  formatBand,
  formatDate,
  formatDateTime,
  formatNumber,
  readStoredLocale,
  translate,
  writeStoredLocale,
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
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== DEFAULT_LOCALE) setLocaleState(stored);
  }, []);

  // Assistive technology pronounces the interface using this attribute, so it has to
  // follow the choice rather than staying at the document's authored language.
  useEffect(() => {
    document.documentElement.lang = LOCALE_TAGS[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStoredLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const next: Locale = current === "en" ? "vi" : "en";
      writeStoredLocale(next);
      return next;
    });
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
