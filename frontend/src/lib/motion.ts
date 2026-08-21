import type { Transition, Variants } from "motion/react";

/**
 * The page's motion vocabulary.
 *
 * Four named variants rather than one, because a page where every section fades up by
 * 24px reads as a template. Each family says something different about the element it
 * moves: rules and headings are *cut* in, cards are *pasted* down, body copy *rises*,
 * and display lines are *masked* up from behind their own baseline.
 *
 * Reduced motion is handled globally by `<MotionConfig reducedMotion="user">` in
 * `MotionProvider`, not by branching here — branching on `useReducedMotion()` at render
 * time changes the tree between server and client and desyncs hydration.
 */

/** Weighty but quick — the settle a paper cut-out makes when it lands. */
export const EDITORIAL_SPRING: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
  mass: 0.9,
};

/** Tighter, for small elements that should snap rather than settle. */
export const SNAP: Transition = { type: "spring", stiffness: 420, damping: 30 };

/** The reference's easing for non-spring moves: fast out, long tail. */
export const EASE_EDITORIAL = [0.16, 1, 0.3, 1] as const;

export type RevealVariant = "cut" | "paste" | "rise" | "maskUp" | "fade";

/**
 * `paste` takes the element's resting rotation as `custom`.
 *
 * This is not cosmetic. `globals.css` flattens `[data-tilt]` under reduced motion, and
 * because motion writes an inline `transform`, a card whose tilt lives only in a
 * Tailwind `rotate-*` class loses that tilt the moment motion takes the property over.
 * The resting angle has to be the animation's target.
 */
export const VARIANTS: Record<RevealVariant, Variants> = {
  /**
   * Rules, kickers and section headings: the block skews in from the left and squares
   * itself up, like a strip of type being slid into a column.
   *
   * This deliberately does **not** animate `clip-path`. A real inset wipe reads better,
   * but motion drops the entire variant when it cannot interpolate the clip shape — not
   * just the clip, the opacity with it — so the element stays frozen at `hidden`,
   * invisible, with no error anywhere. Three sections shipped blank that way before it
   * was caught. `scaleX` from a left origin gives most of the same read using
   * transform, which is also the cheaper property to animate.
   */
  cut: {
    hidden: { opacity: 0, x: -18, scaleX: 0.94 },
    shown: {
      opacity: 1,
      x: 0,
      scaleX: 1,
      transition: { duration: 0.66, ease: EASE_EDITORIAL },
    },
  },
  paste: {
    hidden: (rotate: number = 0) => ({
      opacity: 0,
      scale: 0.92,
      rotate: rotate + 5,
      y: 22,
    }),
    shown: (rotate: number = 0) => ({
      opacity: 1,
      scale: 1,
      rotate,
      y: 0,
      transition: EDITORIAL_SPRING,
    }),
  },
  rise: {
    hidden: { opacity: 0, y: 24 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: EASE_EDITORIAL },
    },
  },
  maskUp: {
    hidden: { y: "110%" },
    shown: { y: "0%", transition: { duration: 0.8, ease: EASE_EDITORIAL } },
  },
  fade: {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: 0.5 } },
  },
};

/** Container variant — children inherit `shown` and cascade. */
export const stagger = (each = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  shown: { transition: { staggerChildren: each, delayChildren } },
});

/** Shared viewport config: reveal once, a quarter of the way in. */
export const VIEWPORT = { once: true, amount: 0.25 } as const;
