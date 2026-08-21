"use client";

import { motion } from "motion/react";

import { VARIANTS, VIEWPORT, stagger, type RevealVariant } from "@/lib/motion";

/**
 * Scroll-triggered entrance for a block of content.
 *
 * Takes `children` rather than rendering content itself, so the sections it wraps stay
 * server components — only this wrapper crosses the client boundary.
 *
 * `data-reveal` is the hook the `<noscript>` rule in `layout.tsx` uses to force
 * everything visible when JavaScript never runs. Without it a failed bundle leaves the
 * page blank, because motion serialises the `hidden` variant into the SSR markup.
 */
export default function Reveal({
  children,
  variant = "rise",
  delay = 0,
  rotate = 0,
  className,
  amount,
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  /** Resting rotation in degrees — required for `paste` on tilted cards. */
  rotate?: number;
  className?: string;
  amount?: number;
}) {
  return (
    <motion.div
      data-reveal
      // The project's reduced-motion contract flattens `[data-tilt]` with an
      // `!important` transform reset. Tagging only rotated wrappers keeps that promise
      // for cards whose resting angle now lives in the variant rather than a class.
      data-tilt={rotate === 0 ? undefined : true}
      className={className}
      custom={rotate}
      variants={VARIANTS[variant]}
      style={variant === "cut" ? { transformOrigin: "left center" } : undefined}
      initial="hidden"
      whileInView="shown"
      viewport={amount === undefined ? VIEWPORT : { ...VIEWPORT, amount }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parent orchestrator: children marked with `RevealItem` cascade instead of arriving
 * together. Use for card grids and list rows.
 */
export function RevealGroup({
  children,
  each = 0.07,
  delayChildren = 0,
  className,
}: {
  children: React.ReactNode;
  each?: number;
  delayChildren?: number;
  className?: string;
}) {
  return (
    <motion.div
      data-reveal
      className={className}
      variants={stagger(each, delayChildren)}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

/** One cascading child of a `RevealGroup`. */
export function RevealItem({
  children,
  variant = "paste",
  rotate = 0,
  className,
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  rotate?: number;
  className?: string;
}) {
  return (
    <motion.div
      data-reveal
      data-tilt={rotate === 0 ? undefined : true}
      className={className}
      custom={rotate}
      variants={VARIANTS[variant]}
    >
      {children}
    </motion.div>
  );
}
