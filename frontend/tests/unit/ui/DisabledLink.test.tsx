import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DisabledLink from "@/components/ui/DisabledLink";

/**
 * T004 — research.md R5.
 *
 * Spec.md needs the same "don't imply it works" treatment in four separate places
 * (FR-006 Speaking, FR-018 General Training, FR-019 stub footer links). One component
 * means those four cannot drift apart in how "unavailable" is signalled.
 */
describe("DisabledLink", () => {
  it("marks an unavailable destination as disabled rather than linking to it (FR-019)", () => {
    const { container } = render(<DisabledLink label="Blog" available={false} />);

    const el = container.querySelector('[aria-disabled="true"]');
    expect(el).not.toBeNull();
    expect(el).toHaveTextContent("Blog");
  });

  it("shows a visible 'Coming soon' marker, not colour alone (FR-006)", () => {
    // A muted colour is invisible to a screen-reader user and to anyone with a
    // colour-vision deficiency. "Visibly marked as not yet available" has to be text.
    render(<DisabledLink label="Speaking" available={false} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("renders no anchor at all when unavailable, so there is nothing to click", () => {
    render(<DisabledLink label="Practice Tests" available={false} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders a normal navigable link when the destination exists", () => {
    render(<DisabledLink label="Pricing" href="/#pricing" available />);

    const link = screen.getByRole("link", { name: "Pricing" });
    expect(link).toHaveAttribute("href", "/#pricing");
    expect(link).not.toHaveAttribute("aria-disabled");
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("treats a missing href as unavailable even if the flag says otherwise", () => {
    // The shape allows `href?` to be absent; an available-but-hrefless entry is a
    // content mistake, and rendering it as a live link would produce exactly the
    // silent dead end SC-005 forbids.
    const { container } = render(<DisabledLink label="Broken" available />);
    expect(container.querySelector('[aria-disabled="true"]')).not.toBeNull();
  });
});
