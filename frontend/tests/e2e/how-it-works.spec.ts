import { expect, test } from "@playwright/test";

import { stubBackend } from "./support/backend";

/** T045 — US5 / FR-003: four steps, with the unbuilt ones honestly marked. */
test.describe("How it works", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page, { signedIn: false });
  });

  test("shows all four steps", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#how-it-works");
    for (const step of ["Submit", "Get scored", "Learn the fix", "Track trend"]) {
      await expect(section.getByRole("heading", { name: new RegExp(step, "i") })).toBeVisible();
    }
  });

  test("marks exactly the two unbuilt steps as coming soon", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#how-it-works").getByText("Coming soon")).toHaveCount(2);
  });

  test("does not mark the two working steps as future", async ({ page }) => {
    await page.goto("/");
    const submit = page
      .locator("#how-it-works")
      .getByRole("heading", { name: /^\s*Submit/i });
    await expect(submit.getByText("Coming soon")).toHaveCount(0);
  });

  test("the problem section names the three frictions FR-002 lists", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /slow feedback loop/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /vague comments/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /prohibitive cost/i })).toBeVisible();
  });

  test("nothing on the landing page implies sentence-level corrections exist today", async ({
    page,
  }) => {
    // 001 returns per-criterion explanations and evidence quotes, not rewrites. The
    // landing page must not sell what the product cannot deliver.
    await page.goto("/");
    const heading = page.locator("#how-it-works").getByRole("heading", {
      name: /learn the fix/i,
    });
    await expect(heading.getByText("Coming soon")).toBeVisible();
  });
});
