import { Marker } from "@/components/ui/Sticker";

/**
 * "How WriteWise works" (Figma node 1001:73).
 *
 * Step 3's description is the one place this section departs from the design copy. The
 * Figma frame reads "line-by-line actionable corrections", but
 * 001-ielts-score-assessment returns a band plus a written comment per criterion and no
 * per-sentence rewrites at all. Shipping the design's wording would have made FR-011
 * false on the day it launched, so the claim is narrowed to what the grader does.
 * Restore the original line if and when the grader actually produces corrections.
 */

export interface HowItWorksStepData {
  index: string;
  title: string;
  body: string;
  tone: "yellow" | "blue" | "green";
  icon: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStepData[] = [
  {
    index: "01",
    title: "Analyze",
    body: "Paste your essay or take a guided practice test. Our AI reads your text in milliseconds.",
    tone: "yellow",
    icon: "📄",
  },
  {
    index: "02",
    title: "Evaluate Criteria",
    body: "We assess against the four official marking criteria: Task Achievement on Task 1 or Task Response on Task 2, plus Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.",
    tone: "blue",
    icon: "🎯",
  },
  {
    index: "03",
    title: "Score & Improve",
    body: "Get your estimated band score alongside a written comment explaining each criterion.",
    tone: "green",
    icon: "📈",
  },
];

const TONE: Record<HowItWorksStepData["tone"], string> = {
  yellow: "bg-accent-yellow-soft",
  blue: "bg-secondary-container",
  green: "bg-tertiary-container",
};

export default function HowItWorksStep({ step }: { step: HowItWorksStepData }) {
  return (
    <article className="relative flex flex-col items-center px-4 text-center">
      <span
        aria-hidden="true"
        data-decoration
        className="absolute -top-8 left-1/2 -translate-x-1/2 font-body text-[60px] font-black tracking-[-3px] text-on-surface/10"
      >
        {step.index}
      </span>
      <span
        aria-hidden="true"
        className={`flex size-24 items-center justify-center rounded-full border-4 border-surface-container-lowest text-[36px] shadow-hairline ${TONE[step.tone]}`}
      >
        {step.icon}
      </span>
      <h3 className="mt-6 font-display text-headline-sm text-on-surface">{step.title}</h3>
      <p className="mt-3 max-w-xs font-body text-body-md leading-[26px] text-on-surface-variant">
        {step.body}
      </p>
    </article>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-y border-outline-variant bg-surface-container-lowest py-section-y"
    >
      <div className="mx-auto max-w-container px-margin-mobile">
        <div className="flex flex-col items-center text-center">
          <Marker className="text-primary">Simple process</Marker>
          <h2 className="mt-1 font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            How <em className="italic text-primary">WriteWise</em> works
          </h2>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-16 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <HowItWorksStep key={step.title} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
