"use client";

/**
 * Light/dark switch (002 T029, FR-018).
 *
 * Holds no submission state and is rendered outside the result tree, so toggling it
 * cannot disturb an in-flight assessment — the edge case the spec calls out. All it does
 * is flip a class on `<html>`; every colour in the app resolves through semantic tokens
 * that follow it.
 */

import { useEffect, useState } from "react";

import { applyTheme, readStoredTheme, toggleTheme, type Theme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Read on mount rather than during render: `localStorage` does not exist during
    // server rendering, and seeding state from it would produce a hydration mismatch.
    // The inline script in the root layout has already applied the class before paint,
    // so this only syncs React's copy of the value.
    const stored = readStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      aria-label={`Switch to ${next} theme`}
      className="rounded border border-outline-variant px-3 py-2 font-body text-body-sm text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
      <span className="sr-only">Switch to {next} theme</span>
    </button>
  );
}
