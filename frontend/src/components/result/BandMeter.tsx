"use client";

/**
 * Band scores drawn as values, not as widths.
 *
 * Both shapes here carry `role="meter"` with a real `aria-valuenow` and a spoken
 * `aria-valuetext`. The visual — an arc or a bar — is `aria-hidden` decoration on top of
 * that. A band rendered only as the width of a div is invisible to exactly the readers
 * who most need it read out, and the number is the entire point of the screen.
 *
 * Tone maps three ranges to three token colours. Nine shades of one hue would tell a
 * reader only that a bar is a bar; "developing / competent / strong" is information.
 */

import { BAND_MAX } from "@/lib/api";
import { bandTone, type BandTone } from "@/lib/api/insights";

const STROKE: Record<BandTone, string> = {
  developing: "text-accent-yellow",
  competent: "text-secondary",
  strong: "text-tertiary",
};

const FILL: Record<BandTone, string> = {
  developing: "bg-accent-yellow",
  competent: "bg-secondary",
  strong: "bg-tertiary",
};

export function toneClass(band: number): string {
  return STROKE[bandTone(band)];
}

export function BandBar({
  band,
  label,
  valueText,
}: {
  band: number;
  label: string;
  valueText: string;
}) {
  return (
    <span
      role="meter"
      aria-label={label}
      aria-valuenow={band}
      aria-valuemin={0}
      aria-valuemax={BAND_MAX}
      aria-valuetext={valueText}
      className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high"
    >
      <span
        aria-hidden="true"
        className={`block h-full rounded-full transition-[width] duration-700 ${FILL[bandTone(band)]}`}
        style={{ width: `${Math.min(100, (band / BAND_MAX) * 100)}%` }}
      />
    </span>
  );
}

/**
 * The overall band as an arc.
 *
 * A stroked circle rather than a filled ring: at the sizes this renders, a filled ring
 * closes up visually and stops reading as a proportion at all.
 */
export function BandDial({
  band,
  label,
  valueText,
  size = 176,
  children,
}: {
  band: number;
  label: string;
  valueText: string;
  size?: number;
  children: React.ReactNode;
}) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, band / BAND_MAX));

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={band}
      aria-valuemin={0}
      aria-valuemax={BAND_MAX}
      aria-valuetext={valueText}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 120 120"
        className="size-full -rotate-90"
        fill="none"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="stroke-surface-container-high"
          strokeWidth="9"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className={`${toneClass(band)} transition-[stroke-dashoffset] duration-1000`}
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
