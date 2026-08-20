"use client";

/**
 * Light/dark switch (002 T029, FR-018).
 *
 * Holds no submission state and lives outside the result tree, so toggling it cannot
 * disturb an in-flight assessment — the edge case the spec calls out. All it does is
 * flip a class on `<html>`; every colour in the app resolves through semantic tokens
 * that follow it.
 *
 * The current theme is read through `useSyncExternalStore` rather than mirrored into
 * `useState` inside an effect. `<html>`'s class list is the actual source of truth (an
 * inline script sets it before first paint), and the server has no way to know the
 * visitor's stored preference — so a dark-theme visitor would get a hydration mismatch
 * from any approach that guessed during render.
 */

import { useSyncExternalStore } from "react";

import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeToTheme,
  toggleTheme,
  type Theme,
} from "@/lib/theme";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label={`Switch to ${next} theme`}
      className="rounded border border-outline-variant px-3 py-2 font-body text-body-sm text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
