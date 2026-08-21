import { expect, test } from "@playwright/test";

import { stubBackend } from "./support/backend";

/**
 * T009 — US1: a visitor reads the landing page and creates an account.
 *
 * This suite had drifted badly against the page it describes: it asserted a
 * `<table>` (the comparison is three tilted cards, deliberately not a table), a
 * "Sign in" link (the header says "Log In"), a "60 seconds" claim that no longer
 * appears anywhere, and a "Score my essay" link that only exists inside the
 * signed-in workspace. Those were failing before the redesign, not because of it.
 */
test.describe("Discover and sign up", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page, { signedIn: false });
  });

  test("the landing page states the value proposition without an account", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/IELTS/i);
    await expect(page.getByText(/4 official IELTS criteria/i).first()).toBeVisible();
  });

  test("the comparison and pricing sections are reachable by scrolling alone", async ({ page }) => {
    await page.goto("/");

    // Three headed lists rather than a grid — see ComparisonTable for why this is not
    // marked up as a table.
    await expect(page.getByRole("heading", { name: /WriteWise/, exact: false }).first()).toBeVisible();
    await expect(page.getByText("transparent pricing")).toBeVisible();
    await expect(page.getByText("$4.99")).toBeVisible();
    await expect(page.getByText("$49.9")).toBeVisible();
  });

  test("exactly one plan is marked recommended", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Recommended", { exact: true })).toHaveCount(1);
  });

  test("signing up lands the learner in the workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /grade writing/i }).first().click();
    await expect(page).toHaveURL(/\/signup$/);

    await page.getByLabel("Email").fill("new.learner@example.com");
    await page.getByLabel("Password").fill("a-long-enough-password");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading", { name: /score an essay/i })).toBeVisible();
  });

  test("a returning visitor can find sign-in as easily as sign-up", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Log In" }).first()).toBeVisible();
    await page.getByRole("link", { name: "Log In" }).first().click();
    await expect(page).toHaveURL(/\/signin$/);
  });
});
