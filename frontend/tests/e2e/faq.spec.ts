import { expect, test } from "@playwright/test";

import { stubBackend } from "./support/backend";

/** T038 — US4: search, no-match state, disclaimer, and nav reachability. */
test.describe("FAQ page", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page, { signedIn: false });
  });

  test("is reachable from the main navigation (FR-013)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "FAQ" }).click();
    await expect(page).toHaveURL(/\/faq$/);
  });

  test("groups questions into the three categories", async ({ page }) => {
    await page.goto("/faq");
    for (const category of ["Getting Started", "Account & Login", "Essay Scoring"]) {
      await expect(page.getByRole("heading", { name: category })).toBeVisible();
    }
  });

  test("search filters the visible questions (FR-014)", async ({ page }) => {
    await page.goto("/faq");
    const before = await page.getByRole("button", { expanded: false }).count();

    await page.getByRole("searchbox").fill("password");
    const after = await page.getByRole("button", { expanded: false }).count();

    expect(after).toBeLessThan(before);
    await expect(page.getByRole("button", { name: /forgot my password/i })).toBeVisible();
  });

  test("says so plainly when a search matches nothing", async ({ page }) => {
    await page.goto("/faq");
    await page.getByRole("searchbox").fill("zzzznotathing");
    await expect(page.getByText(/no questions match/i)).toBeVisible();
  });

  test("carries the official-score disclaimer in Essay Scoring (FR-015)", async ({ page }) => {
    await page.goto("/faq");
    await page.getByRole("button", { name: /is the score official/i }).click();
    await expect(page.getByText(/not an official or certified IELTS result/i)).toBeVisible();
  });

  test("opening a second question closes the first within a category (FR-016)", async ({
    page,
  }) => {
    await page.goto("/faq");
    await page.getByRole("button", { name: /what is writewise/i }).click();
    await expect(page.getByText(/scores IELTS Writing essays/i)).toBeVisible();

    await page.getByRole("button", { name: /who is it for/i }).click();
    await expect(page.getByText(/scores IELTS Writing essays/i)).toHaveCount(0);
  });

  test("categories keep independent open state", async ({ page }) => {
    // FR-016 scopes single-open to a category, so opening in one must not close another.
    await page.goto("/faq");
    await page.getByRole("button", { name: /what is writewise/i }).click();
    await page.getByRole("button", { name: /is the score official/i }).click();

    await expect(page.getByText(/scores IELTS Writing essays/i)).toBeVisible();
    await expect(page.getByText(/not an official or certified IELTS result/i)).toBeVisible();
  });

  test("does not claim Google sign-in, which the product does not support", async ({ page }) => {
    await page.goto("/faq");
    await page.getByRole("button", { name: /sign in with google/i }).click();
    await expect(page.getByText(/not yet/i).first()).toBeVisible();
  });
});
