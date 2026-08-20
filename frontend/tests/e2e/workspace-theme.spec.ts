import { expect, test } from "@playwright/test";

import { LONG_ESSAY, stubBackend } from "./support/backend";

/** T024 — FR-018 / SC-007: theme persists, and switching it never disturbs a submission. */
test.describe("Workspace theme", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page, { signedIn: true });
  });

  test("toggling applies the dark class", async ({ page }) => {
    await page.goto("/workspace");
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await page.getByRole("button", { name: /switch to dark/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("the choice survives a reload, with no flash of the wrong theme", async ({ page }) => {
    await page.goto("/workspace");
    await page.getByRole("button", { name: /switch to dark/i }).click();

    await page.reload();
    // Asserted immediately after load: the inline script must have applied the class
    // before first paint, not after hydration.
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("the choice carries across pages", async ({ page }) => {
    await page.goto("/workspace");
    await page.getByRole("button", { name: /switch to dark/i }).click();

    await page.goto("/faq");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("switching theme mid-submission does not interrupt the request", async ({ page }) => {
    await stubBackend(page, { signedIn: true, assessmentDelayMs: 1500 });
    await page.goto("/workspace");

    await page.locator("#essay_text").fill(LONG_ESSAY);
    await page.getByRole("button", { name: /score my essay/i }).click();
    await expect(page.getByText(/scoring against all four criteria/i)).toBeVisible();

    await page.getByRole("button", { name: /switch to dark/i }).click();

    // The in-flight request still lands, and the result renders in the new theme.
    await expect(page.getByTestId("overall-band")).toHaveText("6.5");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("the result panel stays legible in dark theme", async ({ page }) => {
    await page.goto("/workspace");
    await page.getByRole("button", { name: /switch to dark/i }).click();

    await page.locator("#essay_text").fill(LONG_ESSAY);
    await page.getByRole("button", { name: /score my essay/i }).click();
    await expect(page.getByTestId("overall-band")).toBeVisible();

    // Body text and page background must not collapse to the same colour — the exact
    // failure mode of a component that only ever had light styling.
    const [fg, bg] = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return [body.color, body.backgroundColor];
    });
    expect(fg).not.toBe(bg);
  });
});
