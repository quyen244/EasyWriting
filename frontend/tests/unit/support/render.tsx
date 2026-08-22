/**
 * Test render helpers.
 *
 * Anything that shows interface text needs the locale provider above it, because `t()`
 * throws without one — a deliberate choice, so a component that forgot the catalogue and
 * hardcoded an English string is caught rather than silently rendering.
 *
 * `renderWithProviders` is therefore the default render for this suite. It composes the
 * same providers `app/layout.tsx` does, minus motion (jsdom stubs that separately) and
 * minus auth, which tests that need it stub per case.
 */

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { LocaleProvider } from "@/hooks/useLocale";

function Providers({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from "@testing-library/react";
export { renderWithProviders as render };
