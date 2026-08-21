"use client";

import { motion } from "motion/react";

import { EASE_EDITORIAL } from "@/lib/motion";

/**
 * A marker swipe that draws itself across a word.
 *
 * The block is a sibling of the word rather than its background, and sits at the
 * default stacking level while the word is lifted above it — pushing it to a negative
 * z-index instead drops it behind the section's own ground unless the parent happens to
 * create a stacking context, which is how the same effect broke once already in
 * `TestimonialCard`.
 *
 * It is `data-decoration`, so under reduced motion it is removed rather than drawn. The
 * word underneath stays legible on the page's own background, which is the point: the
 * emphasis is a bonus, never the only thing carrying the meaning.
 */
export default function Highlighter({
  children,
  delay = 0.7,
  className = "bg-primary-container",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <span className="relative inline-block">
      <motion.span
        aria-hidden="true"
        data-decoration
        className={`absolute inset-x-[-0.06em] bottom-[0.09em] top-[0.15em] origin-left ${className}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay, duration: 0.62, ease: EASE_EDITORIAL }}
      />
      <span className="relative z-raised">{children}</span>
    </span>
  );
}
