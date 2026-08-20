import { expect, test } from "@playwright/test";

import { LONG_ESSAY, stubBackend } from "./support/backend";

/**
 * Scopes to the workspace's result region. `page.getByRole("alert")` alone also matches
 * Next's own route announcer, which is an empty live region present on every page — a
 * strict-mode violation rather than a real ambiguity in the UI.
 */
const resultPanel = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Result" });

/** T023 — US2: submit → in-progress → result, and a rejection preserves the essay. */
test.describe("Workspace assessment", () => {
  test("submitting shows progress, then the visualised result in the same view", async ({
    page,
  }) => {
    await stubBackend(page, { signedIn: true, assessmentDelayMs: 800 });
    await page.goto("/workspace");

    await page.locator("#essay_text").fill(LONG_ESSAY);
    await page.getByRole("button", { name: /score my essay/i }).click();

    await expect(page.getByText(/scoring against all four criteria/i)).toBeVisible();

    await expect(page.getByTestId("overall-band")).toHaveText("6.5");
    await expect(page.getByTestId("criterion-card")).toHaveCount(4);
    // Never navigated away — FR-005 requires the result in the same view.
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.locator("#essay_text")).toBeVisible();
  });

  test("expanding a criterion reveals its explanation and the quotes from the essay", async ({
    page,
  }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/workspace");

    await page.locator("#essay_text").fill(LONG_ESSAY);
    await page.getByRole("button", { name: /score my essay/i }).click();
    await expect(page.getByTestId("overall-band")).toBeVisible();

    await page.getByRole("button", { name: /task response/i }).click();
    await expect(page.getByText(/the position is clear/i)).toBeVisible();
    await expect(page.getByText(/some people believe that technology is harmful/i)).toBeVisible();
  });

  test("a rejected submission keeps the essay text in the editor (FR-009)", async ({ page }) => {
    await stubBackend(page, {
      signedIn: true,
      assessment: {
        ok: false,
        status: 400,
        body: {
          error: "BELOW_MIN_WORDS",
          message: "Essay is below the minimum word count.",
          minimum_words: 250,
        },
      },
    });
    await page.goto("/workspace");

    await page.locator("#essay_text").fill("Too short to score.");
    await page.getByRole("button", { name: /score my essay/i }).click();

    await expect(resultPanel(page).getByRole("alert")).toContainText(/at least 250 words/i);
    await expect(page.locator("#essay_text")).toHaveValue("Too short to score.");
  });

  test("a service failure offers retry and does not blame the essay", async ({ page }) => {
    await stubBackend(page, {
      signedIn: true,
      assessment: {
        ok: false,
        status: 503,
        body: { error: "SCORING_FAILED", message: "Scoring is temporarily unavailable." },
      },
    });
    await page.goto("/workspace");

    await page.locator("#essay_text").fill(LONG_ESSAY);
    await page.getByRole("button", { name: /score my essay/i }).click();

    await expect(resultPanel(page).getByRole("alert")).toContainText(/problem on our side/i);
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  });

  test("the workspace shows one assessment, not a history list (FR-011)", async ({ page }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/workspace");

    await page.locator("#essay_text").fill(LONG_ESSAY);
    await page.getByRole("button", { name: /score my essay/i }).click();
    await expect(page.getByTestId("overall-band")).toBeVisible();

    await expect(page.getByTestId("overall-band")).toHaveCount(1);
  });
});
