"use client";

import { motion } from "motion/react";

import { VARIANTS, stagger } from "@/lib/motion";

/**
 * Display type that rises from behind its own baseline, one line at a time.
 *
 * Each line needs its own `overflow: hidden` box, which is why this cannot be a plain
 * `Reveal` around a heading: the mask has to clip per line, not per block.
 *
 * The heading element itself stays in the caller's markup so the document outline and
 * any test that queries by role are unaffected — this only wraps the runs inside it.
 */
export function MaskLines({
  children,
  className,
  each = 0.08,
  delayChildren = 0,
}: {
  children: React.ReactNode;
  className?: string;
  each?: number;
  delayChildren?: number;
}) {
  return (
    <motion.span
      data-reveal
      className={className}
      variants={stagger(each, delayChildren)}
      initial="hidden"
      animate="shown"
    >
      {children}
    </motion.span>
  );
}

/** One masked line. Renders as a block so the clip box matches the line box. */
export function MaskLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`block overflow-hidden pb-[0.12em] ${className ?? ""}`}>
      <motion.span className="block" variants={VARIANTS.maskUp}>
        {children}
      </motion.span>
    </span>
  );
}
