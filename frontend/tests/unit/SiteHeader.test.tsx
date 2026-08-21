import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SiteHeader from "@/components/SiteHeader";

/** T016 — spec.md FR-003, FR-018, US1 scenario 4/5. */
describe("SiteHeader", () => {
  it("shows the WriteWise mark, linked home (FR-003)", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "WriteWise" })).toHaveAttribute("href", "/");
  });

  it("makes sign-in exactly as reachable as sign-up (US1 scenario 4)", () => {
    // A returning visitor should not have to hunt for Login. Both actions are present
    // and both are real links, not one link and one visual afterthought.
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute("href", "/signin");
    expect(screen.getByRole("link", { name: /join now/i })).toHaveAttribute("href", "/signup");
  });

  it("reaches Pricing and the FAQ from the nav (FR-003)", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/#pricing");
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/faq");
  });

  it("links the Academic track at the grader, not a placeholder (FR-005)", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Academic" })).toHaveAttribute("href", "/workspace");
  });

  it("renders General Training as disabled, never as a live link (FR-018)", () => {
    // 001's grader cannot score General Training Task 1 — different descriptors. A live
    // nav link would walk a visitor into an assessment that cannot read their writing.
    render(<SiteHeader />);
    expect(screen.queryByRole("link", { name: /general training/i })).not.toBeInTheDocument();
    expect(screen.getByText("General Training").closest("[aria-disabled='true']")).not.toBeNull();
  });

  it("labels the disabled track so the state is readable, not just styled", () => {
    render(<SiteHeader />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
