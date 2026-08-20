import { expect, test } from "@playwright/test";

import { ACCOUNT, stubBackend } from "./support/backend";

/** T033 — US3: view the profile, sign out, and stay out. */
test.describe("Profile and sign out", () => {
  test("the profile shows the account's display name and email (FR-008)", async ({ page }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/profile");

    await expect(page.getByText(ACCOUNT.display_name)).toBeVisible();
    await expect(page.getByText(ACCOUNT.email)).toBeVisible();
  });

  test("the profile is view-only (FR-012)", async ({ page }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/profile");
    await expect(page.getByRole("textbox")).toHaveCount(0);
  });

  test("signing out returns to the landing page (FR-009)", async ({ page }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/profile");

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/");
  });

  test("after signing out the workspace is no longer reachable (FR-010)", async ({ page }) => {
    // The session stub flips to signed-out, which is what the real backend does once
    // the refresh cookie is revoked.
    await stubBackend(page, { signedIn: true });
    await page.goto("/profile");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/");

    await stubBackend(page, { signedIn: false });
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("going back after sign-out does not restore the workspace", async ({ page }) => {
    await stubBackend(page, { signedIn: true });
    await page.goto("/workspace");
    await expect(page.getByRole("heading", { name: /score an essay/i })).toBeVisible();

    await page.getByRole("link", { name: /mai nguyen|profile/i }).click();
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/");

    await stubBackend(page, { signedIn: false });
    await page.goBack();
    await expect(page.getByRole("heading", { name: /score an essay/i })).toHaveCount(0);
  });
});
