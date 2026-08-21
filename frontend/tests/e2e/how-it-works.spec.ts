import { expect, test } from "@playwright/test";

import { stubBackend } from "./support/backend";

/**
 * US3 / FR-007, FR-008 — the three-step explanation, rewritten for the `writewise`
 * design. The retired version asserted four steps and a "Problem" section, neither of
 * which exists in the new design.
 */
test.describe("How it works", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page, { signedIn: false });
  });

  test("shows exactly the three designed steps", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#how-it-works");
    for (const step of ["Analyze", "Evaluate Criteria", "Score & Improve"]) {
      await expect(section.getByRole("heading", { name: step })).toBeVisible();
    }
  });

  test("names the four official criteria rather than initials", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#how-it-works");
    for (const criterion of [
      "Task Achievement",
      "Task Response",
      "Coherence & Cohesion",
      "Lexical Resource",
      "Grammatical Range & Accuracy",
    ]) {
      await expect(section.getByText(criterion, { exact: false })).toBeVisible();
    }
  });

  test("the hero's secondary CTA reaches the section without leaving the page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "How it works" }).first().click();
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect(page.locator("#how-it-works")).toBeVisible();
  });

  test("nothing on the page promises line-by-line corrections", async ({ page }) => {
    // 001 returns a band and a per-criterion comment, not per-sentence rewrites. The
    // Figma copy for step 3 said otherwise and was deliberately narrowed.
    await page.goto("/");
    await expect(page.getByText(/line-by-line/i)).toHaveCount(0);
  });
});
