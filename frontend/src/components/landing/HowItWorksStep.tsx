import { AnalyzeIcon, CriteriaIcon, ScoreIcon, StepPath } from "@/components/ui/Icon";
import { Marker } from "@/components/ui/Sticker";

/**
 * "How WriteWise works" — cloned from the reference's How It Works section: three steps
 * threaded by a dashed curve, with the middle step dropped half a step lower so the row
 * reads as a path rather than a row of equal tiles.
 *
 * Steps 2 and 3 depart from the reference's copy, and both departures are requirements
 * rather than preferences:
 *
 *  - the reference writes "TR, CC, LR, and GRA". Initials are not a claim a visitor can
 *    check, and FR-008 asks for the four criteria under the names
 *    001-ielts-score-assessment actually uses.
 *  - the reference writes "line-by-line actionable corrections". 001 returns a band plus
 *    a written comment per criterion and no per-sentence rewrites at all, so shipping
 *    that line would have made FR-011 false on the day it launched.
 */

export interface HowItWorksStepData {
  index: string;
  title: string;
  body: string;
  tone: "yellow" | "blue" | "green";
  Icon: (props: { className?: string }) => React.ReactElement;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStepData[] = [
  {
    index: "01",
    title: "Analyze",
    body: "Paste your essay or take a guided practice test. Our AI reads your text in milliseconds.",
    tone: "yellow",
    Icon: AnalyzeIcon,
  },
  {
    index: "02",
    title: "Evaluate Criteria",
    body: "We assess against the four official marking criteria: Task Achievement on Task 1 or Task Response on Task 2, plus Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.",
    tone: "blue",
    Icon: CriteriaIcon,
  },
  {
    index: "03",
    title: "Score & Improve",
    body: "Get your estimated band score alongside a written comment explaining each criterion.",
    tone: "green",
    Icon: ScoreIcon,
  },
];

const TONE: Record<HowItWorksStepData["tone"], { bubble: string; icon: string }> = {
  yellow: { bubble: "bg-accent-yellow-soft", icon: "text-accent-yellow" },
  blue: { bubble: "bg-secondary-container", icon: "text-accent-blue" },
  green: { bubble: "bg-tertiary-container", icon: "text-accent-green" },
};

export default function HowItWorksStep({ step }: { step: HowItWorksStepData }) {
  const { Icon } = step;

  return (
    <div className="relative flex flex-col items-center text-center">
      <span
        aria-hidden="true"
        data-decoration
        className="absolute -left-4 -top-8 z-0 font-body text-[60px] font-black tracking-tighter text-on-surface/10"
      >
        {step.index}
      </span>
      <span
        className={`relative z-10 mb-6 flex size-24 items-center justify-center rounded-full border-4 border-surface-container-lowest shadow-hairline ${TONE[step.tone].bubble}`}
      >
        <Icon className={`size-10 ${TONE[step.tone].icon}`} />
      </span>
      <h3 className="z-10 mb-3 font-display text-headline-sm text-on-surface">{step.title}</h3>
      <p className="z-10 max-w-xs font-body text-body-md leading-relaxed text-on-surface-variant">
        {step.body}
      </p>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-y border-outline-variant bg-surface-container-lowest py-24"
    >
      <div className="mx-auto max-w-container px-margin-mobile">
        <div className="relative z-10 mb-20 flex flex-col items-center text-center">
          <Marker className="mb-2 text-primary">Simple process</Marker>
          <h2 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            How <em className="italic text-primary">WriteWise</em> works
          </h2>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <StepPath className="absolute left-0 top-1/2 z-0 hidden h-full w-full -translate-y-1/2 text-outline-variant lg:block" />

          <div className="relative z-10 flex flex-col justify-between gap-16 lg:flex-row lg:gap-8">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div
                key={step.title}
                // The middle step sits lower so the three read as points along the
                // dashed path rather than as a row of equal tiles.
                className={
                  i === 1 ? "w-full lg:w-1/3 lg:translate-y-16" : "w-full lg:w-1/3"
                }
              >
                <HowItWorksStep step={step} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
