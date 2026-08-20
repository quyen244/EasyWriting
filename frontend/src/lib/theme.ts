/**
 * Light/dark theme preference (002 T003, research.md decision 5).
 *
 * Deliberately not a React store: this is one boolean persisted to `localStorage` and
 * mirrored as a class on `<html>`. Introducing a state library for it would violate
 * Constitution Principle VI, and Tailwind's `darkMode: "class"` strategy already reads
 * the class directly, so the DOM *is* the source of truth for rendering.
 *
 * Every `localStorage` access is guarded. Safari's private mode and some embedded
 * webviews throw on access rather than returning null; losing a cosmetic preference is
 * acceptable, taking the whole page down with it is not.
 */

export type Theme = "light" | "dark";

export const STORAGE_KEY = "writewise.theme";

const DEFAULT_THEME: Theme = "light";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Persist and apply. Applying still happens if persistence fails. */
export function writeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Preference will not survive a reload; the current page still renders correctly.
  }
  applyTheme(theme);
}

/** Flip the current preference and return the new one. */
export function toggleTheme(): Theme {
  const next: Theme = readStoredTheme() === "dark" ? "light" : "dark";
  writeTheme(next);
  return next;
}

/**
 * Inline script that runs before first paint to avoid a flash of the wrong theme.
 *
 * This has to be a string injected into the document head: a React effect runs after
 * hydration, which is already too late — the user sees a white flash before the dark
 * theme applies. It reads the same key and applies the same class as the functions
 * above, and swallows any error so a storage exception cannot block rendering.
 */
export const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
  if (t === "dark") document.documentElement.classList.add("dark");
} catch (e) {}
`.trim();
