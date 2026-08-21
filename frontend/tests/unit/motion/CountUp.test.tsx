import { describe, expect, it } from "vitest";

import { formatFigure, parseFigure } from "@/components/motion/CountUp";

/**
 * The count-up animates the numeric run inside a formatted figure and leaves everything
 * around it alone. These are the cases the hero actually ships, so a parser change that
 * turns `+1.5` into `1.5` or drops the `K` in `500K+` fails here rather than on the page.
 */
describe("parseFigure", () => {
  it("splits a figure into prefix, number and suffix", () => {
    expect(parseFigure("500K+")).toEqual({
      prefix: "",
      target: 500,
      suffix: "K+",
      decimals: 0,
      grouped: false,
    });

    expect(parseFigure("+1.5")).toEqual({
      prefix: "+",
      target: 1.5,
      suffix: "",
      decimals: 1,
      grouped: false,
    });

    expect(parseFigure("95%+")).toMatchObject({ target: 95, suffix: "%+" });
    expect(parseFigure("<1 min")).toMatchObject({ prefix: "<", target: 1, suffix: " min" });
    expect(parseFigure("8,847")).toMatchObject({ target: 8847, grouped: true });
  });

  it("returns null for a figure with no number to animate", () => {
    // "Instant" and similar copy is passed through untouched rather than becoming NaN.
    expect(parseFigure("Instant")).toBeNull();
  });
});

describe("formatFigure", () => {
  it("rebuilds the original string at the target value", () => {
    for (const value of ["500K+", "95%+", "+1.5", "8,847", "5.0+"]) {
      const parsed = parseFigure(value);
      expect(parsed, value).not.toBeNull();
      expect(formatFigure(parsed!.target, parsed!)).toBe(value);
    }
  });

  it("keeps the decimal places and grouping steady mid-count", () => {
    // Without this the figure's width jumps around as it counts, which shifts every
    // element to the right of it on each frame.
    const oneDecimal = parseFigure("+1.5")!;
    expect(formatFigure(0, oneDecimal)).toBe("+0.0");
    expect(formatFigure(0.75, oneDecimal)).toBe("+0.8");

    const grouped = parseFigure("8,847")!;
    expect(formatFigure(1234, grouped)).toBe("1,234");
  });
});
