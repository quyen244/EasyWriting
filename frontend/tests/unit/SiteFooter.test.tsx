import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SiteFooter from "@/components/SiteFooter";
import { FOOTER_COLUMNS } from "@/lib/navigation";

/** T018 — spec.md FR-019, FR-022, SC-005. */
describe("SiteFooter", () => {
  it("shows the mark, a tagline, and a copyright line (FR-022)", () => {
    render(<SiteFooter />);

    expect(screen.getByText("WriteWise")).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} WriteWise/)).toBeInTheDocument();
  });

  it("groups links into Product, Resources and Company (FR-022)", () => {
    render(<SiteFooter />);
    for (const column of FOOTER_COLUMNS) {
      expect(screen.getByRole("heading", { name: column.title })).toBeInTheDocument();
    }
  });

  it("renders every unavailable entry as disabled, never as a dead link (FR-019)", () => {
    // SC-005 is "zero silent dead ends". A footer full of plausible-looking links to
    // pages nobody has written is the most common way a redesigned marketing page
    // breaks that, so it is asserted rather than reviewed.
    const { container } = render(<SiteFooter />);

    for (const column of FOOTER_COLUMNS) {
      for (const link of column.links.filter((l) => !l.available)) {
        expect(
          screen.queryByRole("link", { name: new RegExp(`^${link.label}$`, "i") }),
          `${link.label} must not be a live link`,
        ).not.toBeInTheDocument();
      }
    }

    const disabledCount = container.querySelectorAll("[aria-disabled='true']").length;
    const expected = FOOTER_COLUMNS.flatMap((c) => c.links).filter((l) => !l.available).length;
    expect(disabledCount).toBe(expected);
  });

  it("keeps the available entries navigable", () => {
    render(<SiteFooter />);
    expect(screen.getAllByRole("link", { name: "FAQ" })[0]).toHaveAttribute("href", "/faq");
  });

  it("repeats the not-an-official-result disclaimer where every visitor meets it", () => {
    // Carried over deliberately from the previous footer: a visitor who never opens the
    // FAQ should still learn the bands are estimates. Constitution TP-1 requires scores
    // be presented as provisional, and the footer is the one place on every page.
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/not official|estimates/i)).toBeInTheDocument();
  });
});
