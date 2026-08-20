import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // @ts-expect-error — Next 16 installs a rolldown-flavoured `vite` at the top level
  // while vitest resolves its own nested copy, so the two `Plugin` types are
  // structurally different despite working together fine at runtime. A duplicate-
  // dependency type clash in the build tooling, not a real incompatibility.
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // E2E specs belong to Playwright, not Vitest — they share the tests/ tree but not
    // the runner, and collecting them here yields confusing "test.describe is not a
    // function" errors rather than an obvious misconfiguration.
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
