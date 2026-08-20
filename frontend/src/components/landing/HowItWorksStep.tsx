/**
 * The four-step product flow (002 T046, FR-003).
 *
 * FR-003 is a truthfulness requirement: "Learn the fix" and "Track trend" are not built,
 * and the section must say so rather than implying they work today.
 *
 * Worth noting where those two lines fall, because it resolves an apparent contradiction
 * inside the spec itself: FR-003 classes per-sentence corrections ("Learn the fix") as a
 * future capability, while FR-005 asks the workspace to render "line-by-line feedback…
 * with a suggested correction". `001`'s API settles it — it returns per-criterion
 * explanations and verbatim evidence quotes, and no per-sentence corrections at all. So
 * the workspace shows what exists (quotes + criterion reasoning) and this section is
 * honest that the correction step is still ahead.
 */

export interface HowItWorksStepData {
  title: string;
  body: string;
  future?: boolean;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStepData[] = [
  {
    title: "Submit",
    body: "Paste your Task 1 or Task 2 essay into a plain, distraction-free editor.",
  },
  {
    title: "Get scored",
    body: "Receive a band for each of the four official criteria, every one explained and quoted from your own writing.",
  },
  {
    title: "Learn the fix",
    body: "Sentence-level corrections and rewrite suggestions, tied to the criterion they affect.",
    future: true,
  },
  {
    title: "Track trend",
    body: "Watch your band move across submissions and see which criterion is holding you back.",
    future: true,
  },
];

export default function HowItWorksStep({
  step,
  index,
}: {
  step: HowItWorksStepData;
  index: number;
}) {
  return (
    <article className="border-t border-outline-variant pt-stack-md">
      <p className="font-display text-headline-sm text-secondary tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 className="mt-stack-sm flex flex-wrap items-center gap-2 font-display text-headline-sm text-on-surface">
        {step.title}
        {step.future && (
          <span className="rounded-sm border border-outline px-2 py-0.5 text-label-caps uppercase text-on-surface-variant">
            Coming soon
          </span>
        )}
      </h3>
      <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">{step.body}</p>
    </article>
  );
}
