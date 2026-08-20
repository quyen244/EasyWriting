import { expect, test } from "@playwright/test";

import { stubBackend } from "./support/backend";

/** T009 — US1: a visitor reads the landing page and creates an account. */
test.describe("Discover and sign up", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page, { signedIn: false });
  });

  test("the landing page states the value proposition without an account", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/IELTS/i);
    await expect(page.getByText(/60 seconds/i).first()).toBeVisible();
  });

  test("the comparison and pricing sections are reachable by scrolling alone", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("Transparent pricing")).toBeVisible();
    await expect(page.getByText("$4.99")).toBeVisible();
    await expect(page.getByText("$49.9")).toBeVisible();
  });

  test("exactly one plan is marked recommended", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Recommended", { exact: true })).toHaveCount(1);
  });

  test("signing up lands the learner in the workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /score my essay/i }).first().click();
    await expect(page).toHaveURL(/\/signup$/);

    await page.getByLabel("Email").fill("new.learner@example.com");
    await page.getByLabel("Password").fill("a-long-enough-password");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading", { name: /score an essay/i })).toBeVisible();
  });

  test("a returning visitor can find sign-in as easily as sign-up", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await page.getByRole("link", { name: "Sign in" }).first().click();
    await expect(page).toHaveURL(/\/signin$/);
  });
});
