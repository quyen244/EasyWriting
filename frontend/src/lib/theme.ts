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

/**
 * The stored choice, or the system preference when there is no choice yet.
 *
 * Falling back to the system preference rather than to light means a visitor whose OS is
 * dark is not shown a white page they then have to fix. An explicit choice always wins
 * over the system, in both directions — that is why `"light"` is stored rather than
 * treated as "no preference".
 */
export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Fall through to the system preference.
  }
  return prefersDarkScheme() ? "dark" : DEFAULT_THEME;
}

function prefersDarkScheme(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
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
  // Reads the DOM, not storage: with a system-preference fallback those two can differ
  // on a first visit, and toggling must flip what the visitor can actually see.
  const next: Theme = getThemeSnapshot() === "dark" ? "light" : "dark";
  writeTheme(next);
  notify();
  return next;
}

/* ── External-store interface for `useSyncExternalStore` ────────────────────────────
 *
 * The live theme is a browser-global that React does not own: an inline script applies
 * it before hydration, and `<html>`'s class list is the real value. Subscribing to it
 * rather than mirroring it into `useState` inside an effect avoids two problems at once
 * — the cascading render React's lint rule warns about, and the hydration mismatch a
 * dark-theme visitor would otherwise see, because the server has no way to know their
 * preference and must render the light label.
 */

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Reads the DOM, which the pre-paint inline script has already set correctly. */
export function getThemeSnapshot(): Theme {
  return typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

/** The server cannot know the visitor's preference; render the default and correct it
 *  on the client, which is what `useSyncExternalStore` is built to do. */
export function getServerThemeSnapshot(): Theme {
  return DEFAULT_THEME;
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
  var system = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (t === "dark" || (t !== "light" && system)) document.documentElement.classList.add("dark");
} catch (e) {}
`.trim();
