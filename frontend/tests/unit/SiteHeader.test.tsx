import { render, screen, within } from "./support/render";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import SiteHeader from "@/components/SiteHeader";
import { NAV_MENUS } from "@/lib/navigation";

/** T016 — spec.md FR-003, FR-006, FR-018, US1 scenario 4/5. */
describe("SiteHeader", () => {
  it("shows the WriteWise mark, linked home (FR-003)", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "WriteWise" })).toHaveAttribute("href", "/");
  });

  it("makes sign-in exactly as reachable as sign-up (US1 scenario 4)", () => {
    // A returning visitor should not have to hunt for the login. Both actions are
    // present and both are real links, not one link and one visual afterthought.
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/signin");
    expect(screen.getByRole("link", { name: /free try/i })).toHaveAttribute("href", "/signup");
  });

  it("reaches Pricing and the FAQ from the nav (FR-003)", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/#pricing");
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/faq");
  });

  it("offers the three product menus, each collapsed to begin with", () => {
    render(<SiteHeader />);
    for (const menu of NAV_MENUS) {
      expect(screen.getByRole("button", { name: menu.label })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    }
  });

  it("opens a menu on click and links Writing at the grader (FR-005)", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.click(screen.getByRole("button", { name: "Grader" }));

    expect(screen.getByRole("button", { name: "Grader" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    for (const label of ["IELTS Writing Task 1", "IELTS Writing Task 2"]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/workspace");
    }
  });

  it("closes an open menu on Escape and hands focus back to its trigger", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const trigger = screen.getByRole("button", { name: "Grader" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("renders every unbuilt menu entry as disabled, never as a live link (FR-006, FR-018)", async () => {
    // Only Writing Task 1 and Task 2 are real. Mock Test, Practice and every Speaking
    // entry describe things 001 cannot do, so each must be unclickable and out of the
    // tab order rather than a plausible link into a route that does not exist.
    const user = userEvent.setup();
    render(<SiteHeader />);

    for (const menu of NAV_MENUS) {
      await user.click(screen.getByRole("button", { name: menu.label }));

      for (const item of menu.items.filter((i) => !i.available)) {
        expect(screen.queryByRole("link", { name: item.label })).not.toBeInTheDocument();

        const entry = screen.getByText(item.label).closest("[aria-disabled='true']");
        expect(entry, `${item.label} must render as disabled`).not.toBeNull();
        expect(within(entry as HTMLElement).getByText(/coming soon/i)).toBeInTheDocument();
      }

      await user.keyboard("{Escape}");
    }
  });

  it("offers a working locale switch (EN/VI)", () => {
    // This control used to render disabled, because there was no second translation of
    // anything. There is now, so it is a real switch — and it is here, on the public
    // header, so a Vietnamese learner can set the preference before signing up rather
    // than after.
    render(<SiteHeader />);
    const vietnamese = screen.getByRole("button", { name: "VI" });
    expect(vietnamese).toBeEnabled();
    expect(vietnamese).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
