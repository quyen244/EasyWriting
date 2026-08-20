import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration (002, tests T009 / T023–T025 / T033 / T038 / T045).
 *
 * The backend is stubbed at the network boundary rather than run for real. That is a
 * deliberate scope line: `001` and `003` already verify their own APIs against a real
 * Postgres and a real model, and these specs exist to prove the *page flows* work.
 * Booting a database and burning API credits to re-test someone else's contract would
 * make the suite slow, expensive and flaky without testing anything new.
 *
 * The stubs are shaped from the real OpenAPI documents, so a contract change on either
 * side still shows up — as a failing unit test against the shared client types, and as
 * a stub that no longer matches what the page expects.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // Production build, not `next dev`: the dev server's error overlay and lazy
    // compilation change timing enough to hide real hydration problems.
    command: "npm run build && npx next start --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
