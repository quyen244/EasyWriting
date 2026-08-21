import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Hero from "@/components/landing/Hero";

/** US1 — FR-001, FR-002, FR-006. */
describe("Hero", () => {
  it("states the product purpose without any interaction (FR-001)", () => {
    render(<Hero />);
    // The headline is split across masked lines, so it is matched on the heading's
    // joined text rather than on a single node.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/grade ielts free/i);
  });

  it("names the criteria it grades against, and does not attribute them to one body", () => {
    // The brief said "4 British Council criteria". The four criteria belong to IELTS,
    // which British Council co-owns with IDP and Cambridge — naming one of the three as
    // the source implies an endorsement by an organisation with no relationship to this
    // product. Same reasoning as the partner-logo strip in TrustStrip.
    const { container } = render(<Hero />);
    // Said twice on purpose: once in the description, once in the demo panel's footer.
    expect(screen.getAllByText(/4 official IELTS criteria/i).length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/british council/i);
  });

  it("offers a primary action into sign-up (FR-002)", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /grade writing/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("offers a secondary action that scrolls rather than navigates (FR-002)", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute(
      "href",
      "/#how-it-works",
    );
  });

  it("renders Grade Speaking as a disabled control, never as a link (FR-006)", () => {
    // Speaking does not exist. A styled anchor here would walk a visitor toward an
    // assessment that cannot listen to them — the same reason FocusAreaSelector refuses
    // to make its Speaking card an anchor.
    render(<Hero />);
    expect(screen.queryByRole("link", { name: /grade speaking/i })).not.toBeInTheDocument();

    const speaking = screen.getByText("Grade Speaking").closest("[aria-disabled='true']");
    expect(speaking).not.toBeNull();
    expect(within(speaking as HTMLElement).getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("carries three headline figures, each with a label a screen reader can reach", () => {
    // The figures themselves are asserted in the CountUp tests rather than here: by the
    // time this renders, the count-up has already replaced the text with an in-flight
    // value, so matching the final string would be a race. What matters at this level
    // is that there are three of them and that each carries a real label — the caption
    // is a `<dt>` rather than a styled `<span>`, so it is announced with the figure.
    const { container } = render(<Hero />);
    expect(container.querySelectorAll("dl dd")).toHaveLength(3);

    for (const label of ["Essays graded", "Accuracy rate", "Band score improved"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("keeps the emphasised word as real emphasis, not a coloured span", () => {
    // The design's whole typographic idea is that one highlighted word. Marking it up
    // as <em> carries the emphasis to a screen reader too, rather than leaving it as a
    // purely visual effect that a highlighter rectangle happens to sit behind.
    const { container } = render(<Hero />);
    const italics = Array.from(container.querySelectorAll("h1 em")).map((el) => el.textContent);
    expect(italics).toContain("free");
  });

  it("describes the demo panel for readers who cannot see it", () => {
    // The panel itself is aria-hidden — it loops forever, and announcing it would be
    // unusable. This sentence is the only thing standing in for it, so its absence is a
    // real accessibility regression rather than a copy change.
    render(<Hero />);
    expect(screen.getByText(/illustration of the grader at work/i)).toBeInTheDocument();
  });
});
