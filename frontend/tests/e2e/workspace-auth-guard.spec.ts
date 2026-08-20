import { expect, test } from "@playwright/test";

import { stubBackend } from "./support/backend";

/** T025 — FR-004 / FR-010 / SC-004: protected routes bounce a signed-out visitor. */
test.describe("Protected route guard", () => {
  test("visiting /workspace signed out redirects to /signin", async ({ page }) => {
    await stubBackend(page, { signedIn: false });
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("visiting /profile signed out redirects to /signin", async ({ page }) => {
    await stubBackend(page, { signedIn: false });
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("protected content never appears, not even briefly (SC-004)", async ({ page }) => {
    await stubBackend(page, { signedIn: false });
    const seenEditor: boolean[] = [];

    page.on("domcontentloaded", async () => {
      seenEditor.push((await page.locator("#essay_text").count()) > 0);
    });

    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/signin$/);
    expect(seenEditor.some(Boolean)).toBe(false);
  });

  test("a signed-in learner reaches the workspace directly", async ({ page }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/workspace");
    await expect(page.getByRole("heading", { name: /score an essay/i })).toBeVisible();
  });
});
