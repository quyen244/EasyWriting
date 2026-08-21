import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestimonialsSection } from "@/components/landing/TestimonialCard";
import { TESTIMONIALS } from "@/lib/testimonials";

/** US5 — FR-017, FR-018. */
describe("Testimonials", () => {
  it("renders every rendered-set testimonial with its name and track (FR-017)", () => {
    // Each quote is split around a <mark>, so it is matched against the blockquote's
    // joined text rather than a single node.
    const { container } = render(<TestimonialsSection />);
    const quotes = Array.from(container.querySelectorAll("blockquote")).map(
      (el) => el.textContent ?? "",
    );

    for (const t of TESTIMONIALS) {
      expect(screen.getByText(t.name)).toBeInTheDocument();
      expect(quotes.some((q) => q.includes(t.quote.slice(0, 30)))).toBe(true);
    }
  });

  it("highlights a phrase inside each quote, and that phrase is really in it", () => {
    // The highlight is stored separately from the quote; if the two drift apart the
    // <mark> would silently render nothing and the sentence would lose a fragment.
    for (const t of TESTIMONIALS) {
      expect(t.quote).toContain(t.highlight);
    }
    const { container } = render(<TestimonialsSection />);
    expect(container.querySelectorAll("mark").length).toBe(TESTIMONIALS.length);
  });

  it("shows at least three testimonials (FR-017)", () => {
    render(<TestimonialsSection />);
    expect(screen.getAllByRole("figure").length).toBeGreaterThanOrEqual(3);
  });

  it("renders no General Training testimonial (FR-018)", () => {
    // Stricter than the disabled-nav-link treatment, deliberately: a testimonial
    // attributes a claim to a named person, so publishing one for a track the grader
    // cannot score asserts something untrue about someone, not just about a route.
    const { container } = render(<TestimonialsSection />);
    expect(container.textContent).not.toMatch(/general training/i);
  });

  it("discloses that the quotes are illustrative, not collected", () => {
    // Not decoration. Named testimonials without this line are fabricated endorsements,
    // which is a different thing from placeholder copy — see lib/testimonials.ts.
    render(<TestimonialsSection />);
    expect(screen.getByText(/illustrative|not collected/i)).toBeInTheDocument();
  });
});
