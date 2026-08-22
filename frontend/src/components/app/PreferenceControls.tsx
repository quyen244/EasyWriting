"use client";

/**
 * Language and theme, side by side.
 *
 * Both are preferences with the same shape — one value, two options, persisted, applied
 * live — so they are built as one pair of controls and dropped wherever preferences
 * belong: the sidebar's account block, the auth screen, the mobile drawer.
 *
 * Neither control holds work-in-progress state, and neither remounts the page. That is
 * what makes it safe to switch language mid-essay or theme mid-grading: the editor's
 * text lives above these in the tree and is never touched.
 */

import { useSyncExternalStore } from "react";

import { useLocale } from "@/hooks/useLocale";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeToTheme,
  toggleTheme,
} from "@/lib/theme";

const SEGMENT =
  "rounded px-2.5 py-1 font-body text-[12px] font-semibold transition-colors";
const ACTIVE = "bg-surface-container-lowest text-on-surface shadow-hairline";
const INACTIVE = "text-on-surface-variant hover:text-on-surface";

export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("prefs.language")}
      className="flex items-center gap-1 rounded-md bg-surface-container p-1"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        title={t("prefs.switchToEnglish")}
        className={`${SEGMENT} ${locale === "en" ? ACTIVE : INACTIVE}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("vi")}
        aria-pressed={locale === "vi"}
        title={t("prefs.switchToVietnamese")}
        className={`${SEGMENT} ${locale === "vi" ? ACTIVE : INACTIVE}`}
      >
        VI
      </button>
    </div>
  );
}

export function ThemeToggle() {
  const { t } = useLocale();
  // `<html>`'s class list is the real value — an inline script sets it before hydration
  // and the server cannot know the visitor's preference, so this subscribes to the DOM
  // rather than mirroring it into state.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label={isDark ? t("prefs.switchToLight") : t("prefs.switchToDark")}
      title={isDark ? t("prefs.switchToLight") : t("prefs.switchToDark")}
      className="flex size-8 items-center justify-center rounded-md bg-surface-container text-on-surface-variant transition-colors hover:text-on-surface"
    >
      <svg
        aria-hidden="true"
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isDark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4" />
          </>
        ) : (
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}

export default function PreferenceControls({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LocaleToggle />
      <ThemeToggle />
    </div>
  );
}
