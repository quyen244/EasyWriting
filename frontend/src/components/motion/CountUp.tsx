"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Counts a display figure up when it scrolls into view.
 *
 * Works on the formatted string rather than a number prop, so the markup keeps the
 * exact figure the copy specifies — `500K+`, `95%+`, `+1.5`, `8,847` — and only the
 * numeric run inside it animates. The prefix and suffix are never touched.
 *
 * The final value is what renders on the server. The count starts from zero in a layout
 * effect, before the browser paints, so there is no flash of the end figure first, and a
 * reader without JavaScript sees the real number rather than a stuck `0`.
 */

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Parsed {
  prefix: string;
  target: number;
  suffix: string;
  decimals: number;
  grouped: boolean;
}

export function parseFigure(value: string): Parsed | null {
  const match = value.match(/^([^\d]*)([\d][\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const [, prefix, digits, suffix] = match;
  const plain = digits.replace(/,/g, "");
  const dot = plain.indexOf(".");

  return {
    prefix,
    target: Number(plain),
    suffix,
    decimals: dot === -1 ? 0 : plain.length - dot - 1,
    grouped: digits.includes(","),
  };
}

export function formatFigure(n: number, { prefix, suffix, decimals, grouped }: Parsed): string {
  const fixed = n.toFixed(decimals);
  const body = grouped
    ? Number(fixed).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : fixed;
  return `${prefix}${body}${suffix}`;
}

export default function CountUp({
  value,
  className,
  duration = 1.4,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const parsed = parseFigure(value);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    // A figure with no numeric run (or a reader who asked for less motion) keeps the
    // literal string the server rendered.
    if (!el || !parsed || reduced || !inView) return;

    el.textContent = formatFigure(0, parsed);
    const controls = animate(0, parsed.target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (n) => {
        el.textContent = formatFigure(n, parsed);
      },
    });

    return () => controls.stop();
    // `parsed` is derived from `value`; depending on the object identity would restart
    // the count on every render.
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
