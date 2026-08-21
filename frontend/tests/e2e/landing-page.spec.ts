import { expect, test } from "@playwright/test";

import { stubBackend } from "./support/backend";

/**
 * Whole-page flow for the redesigned landing page (quickstart.md).
 *
 * Note the known limitation this suite deliberately does not treat as a bug: `/signup`
 * and `/signin` exist and are reachable, but their Supabase wiring belongs to a separate
 * (unbuilt) feature and will fail on submit. These tests assert reachability only —
 * research.md R4.
 */
test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page, { signedIn: false });
    await page.goto("/");
  });

  test("states the pitch above the fold (SC-001)", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Grade IELTS free/i);
  });

  test("offers sign-up at the top and again at the bottom (SC-002)", async ({ page }) => {
    await expect(page.getByRole("link", { name: /grade writing/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /start scoring for free/i })).toBeVisible();
  });

  test("Speaking never leads to a live assessment (US2 scenario 4)", async ({ page }) => {
    const speaking = page.getByRole("link", { name: /speaking/i });
    await expect(speaking).toHaveCount(0);
    await expect(page.getByText("Coming soon").first()).toBeVisible();
  });

  test("each pricing CTA carries its plan into sign-up (FR-016)", async ({ page }) => {
    for (const [plan, cta] of [
      ["free", "Get started"],
      ["lifetime", "Go Lifetime"],
    ] as const) {
      const link = page
        .locator("#pricing")
        .getByRole("link", { name: cta, exact: true })
        .first();
      await expect(link).toHaveAttribute("href", `/signup?plan=${plan}`);
    }
  });

  test("FAQ items expand independently without navigating (SC-007)", async ({ page }) => {
    const items = page.locator("#faq details");
    await expect(items).toHaveCount(3);

    const url = page.url();
    await items.nth(1).locator("summary").click();
    await expect(items.nth(1)).toHaveAttribute("open", "");
    await expect(items.nth(0)).not.toHaveAttribute("open", "");
    await expect(items.nth(2)).not.toHaveAttribute("open", "");
    expect(page.url()).toBe(url);
  });

  test("no navigation or footer link is a silent dead end (SC-005)", async ({ page }) => {
    // Every anchor must point at a route this app serves. Anything unbuilt has to
    // render through the disabled treatment instead of as a plausible link.
    const routes = ["/", "/faq", "/signin", "/signup", "/workspace", "/profile"];

    // The product menus render their links only while open, so the audit has to open
    // each one — otherwise it silently checks nothing but the header's flat links.
    for (const menu of ["Grader", "Mock Test", "Practice"]) {
      await page.getByRole("button", { name: menu, exact: true }).click();
      await expect(page.getByRole("button", { name: menu, exact: true })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    }

    const hrefs = await page.locator("header a, footer a").evaluateAll((els) =>
      els.map((el) => el.getAttribute("href") ?? ""),
    );
    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      const path = href.split("#")[0] || "/";
      expect(routes, `dead end: ${href}`).toContain(path);
    }

    await expect(page.locator("footer [aria-disabled='true']")).not.toHaveCount(0);
  });

  test("the page's text survives reduced motion (Edge Cases)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /grade writing/i })).toBeVisible();
    await expect(page.locator("#pricing")).toBeVisible();

    // The demo panel never starts its loop, so the frame left on screen is the one
    // that makes sense standing still rather than a half-typed essay.
    await expect(page.getByText(/provisional estimate/i)).toBeVisible();
  });
});
