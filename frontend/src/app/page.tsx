import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ComparisonTable from "@/components/landing/ComparisonTable";
import ExpertReviewCard, { type ExpertReview } from "@/components/landing/ExpertReviewCard";
import FinalCta from "@/components/landing/FinalCta";
import HowItWorksStep, { HOW_IT_WORKS_STEPS } from "@/components/landing/HowItWorksStep";
import Hero from "@/components/landing/Hero";
import LearnerReviewCard, { type LearnerReview } from "@/components/landing/LearnerReviewCard";
import PricingCard from "@/components/landing/PricingCard";
import ProblemSection from "@/components/landing/ProblemSection";
import { PRICING_PLANS } from "@/lib/pricing";

/**
 * Landing page (002 T016 + T047, US1 + US5).
 *
 * Testimonials below are illustrative placeholder copy carried over from the approved
 * mockup, not real quotes from real people. They are marked as such here so nobody
 * later mistakes them for collected feedback — attributing invented praise to a named
 * professional is the kind of thing that has to be a deliberate decision, not an
 * accident of copying a design file.
 */

const EXPERT_REVIEWS: ExpertReview[] = [
  {
    quote:
      "The band descriptors are applied consistently, and every judgement points back at a specific line in the candidate's own essay.",
    name: "Illustrative expert quote",
    title: "Placeholder — awaiting real endorsements",
  },
  {
    quote:
      "The value is in the turnaround. Students can iterate several times in an evening instead of once a week.",
    name: "Illustrative expert quote",
    title: "Placeholder — awaiting real endorsements",
  },
  {
    quote:
      "It handles the mechanical diagnostics, which frees teaching time for argumentation and structure.",
    name: "Illustrative expert quote",
    title: "Placeholder — awaiting real endorsements",
  },
];

const LEARNER_REVIEWS: LearnerReview[] = [
  {
    quote:
      "Seeing which sentences the score was actually based on told me more than any general comment had.",
    name: "Illustrative learner quote — placeholder",
    progress: "6.0 → 7.5",
  },
  {
    quote:
      "Being able to write an essay in the morning and know where it stood before work changed how I practised.",
    name: "Illustrative learner quote — placeholder",
    progress: "6.5 → 8.0",
  },
  {
    quote:
      "The per-criterion breakdown showed my grammar was fine and my lexical range was the problem.",
    name: "Illustrative learner quote — placeholder",
    progress: "7.0 → 8.0",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProblemSection />
        <ComparisonTable />

        <section
          id="how-it-works"
          className="mx-auto max-w-container px-margin-mobile py-stack-lg md:px-margin-desktop"
        >
          <h2 className="font-display text-headline-md text-on-surface">
            Four steps to a higher score
          </h2>
          <p className="mt-stack-sm max-w-2xl font-body text-body-md text-on-surface-variant">
            Two of these work today. The other two are where the product is going — marked
            so, rather than implied.
          </p>
          <div className="mt-stack-md grid gap-gutter md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <HowItWorksStep key={step.title} step={step} index={index} />
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="border-y border-outline-variant bg-surface-container-low"
        >
          <div className="mx-auto max-w-container px-margin-mobile py-stack-lg md:px-margin-desktop">
            <h2 className="font-display text-headline-md text-on-surface">
              Transparent pricing
            </h2>
            <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
              The free plan is a real plan — a full score on all four criteria, once a day.
            </p>
            <div className="mt-stack-md grid gap-gutter md:grid-cols-2 lg:grid-cols-4">
              {PRICING_PLANS.map((plan) => (
                <PricingCard key={plan.name} plan={plan} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-container px-margin-mobile py-stack-lg md:px-margin-desktop">
          <h2 className="font-display text-headline-md text-on-surface">
            Built around the published IELTS criteria
          </h2>
          <p className="mt-stack-sm font-body text-body-sm text-on-surface-variant">
            The quotes below are placeholder copy from the design mockup, not collected
            testimonials.
          </p>
          <div className="mt-stack-md grid gap-gutter md:grid-cols-3">
            {EXPERT_REVIEWS.map((review, i) => (
              <ExpertReviewCard key={i} review={review} />
            ))}
          </div>
          <div className="mt-gutter grid gap-gutter md:grid-cols-3">
            {LEARNER_REVIEWS.map((review, i) => (
              <LearnerReviewCard key={i} review={review} />
            ))}
          </div>
        </section>

        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
