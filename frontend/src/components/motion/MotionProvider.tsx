"use client";

import { MotionConfig } from "motion/react";

/**
 * One global motion policy, mounted once in the root layout.
 *
 * `reducedMotion="user"` makes every `motion` element in the tree drop transform and
 * layout animation when the reader has asked for less motion, while leaving opacity
 * alone — opacity is not vestibular-triggering, and keeping it means content still
 * arrives rather than popping.
 *
 * Doing it here rather than per-component matters for correctness, not tidiness: a
 * component that branches on `useReducedMotion()` inside its own render emits different
 * markup on the server than on the client and desyncs hydration.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
