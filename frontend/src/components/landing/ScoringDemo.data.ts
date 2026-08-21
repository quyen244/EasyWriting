/**
 * Content for the hero's product demo.
 *
 * This is a depiction of the grader, not a call into it — the numbers below are a
 * scripted example, not a real assessment, which is why the panel labels the band as a
 * provisional estimate (constitution TP-1) and why the whole thing is `aria-hidden`.
 *
 * The essay is deliberately short. It is typed one character at a time, so length is a
 * duration: at ~21ms a character, this run takes about five seconds before the scoring
 * phase can begin, which is already near the limit of what a hero animation should hold
 * a reader for.
 */

export type Phase = "typing" | "scoring" | "revealed";

export const DEMO_TABS = ["Task 1", "Task 2", "Speaking"] as const;
export const ACTIVE_TAB = "Task 2";

export const DEMO_PROMPT =
  "Some people believe university students should pay the full cost of their studies. To what extent do you agree or disagree?";

export const DEMO_ESSAY =
  "While some argue that students should meet the full cost of their degrees, I believe governments should continue to fund a substantial share. This essay will examine the economic case for public investment before turning to the question of fairness.";

export const DEMO_STEPS = [
  "Analyzing the prompt",
  "Comparing scoring criteria",
  "Scoring the essay",
] as const;

export interface CriterionScore {
  /** The official criterion name, not an initialism. */
  label: string;
  short: string;
  band: number;
}

export const DEMO_CRITERIA: CriterionScore[] = [
  { label: "Task Response", short: "TR", band: 7.5 },
  { label: "Coherence & Cohesion", short: "CC", band: 8.0 },
  { label: "Lexical Resource", short: "LR", band: 7.0 },
  { label: "Grammatical Range & Accuracy", short: "GRA", band: 7.5 },
];

export const DEMO_OVERALL = 7.5;

/** Timings, in milliseconds. */
export const CHAR_MS = 21;
export const AFTER_TYPING_MS = 600;
export const STEP_MS = 1150;
export const AFTER_STEPS_MS = 420;
export const HOLD_REVEALED_MS = 4800;
