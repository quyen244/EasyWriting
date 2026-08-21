import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TestimonialsSection } from "@/components/landing/TestimonialCard";
import { TESTIMONIALS } from "@/lib/testimonials";

/** US5 — FR-017, FR-018. */
describe("Testimonials", () => {
  it("renders every rendered-set testimonial with its name and track (FR-017)", () => {
    render(<TestimonialsSection />);
    for (const t of TESTIMONIALS) {
      expect(screen.getByText(t.name)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(t.quote.slice(0, 30)))).toBeInTheDocument();
    }
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
