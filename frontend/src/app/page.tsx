import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ComparisonTable from "@/components/landing/ComparisonTable";
import FaqTeaser from "@/components/landing/FaqTeaser";
import FinalCta from "@/components/landing/FinalCta";
import FocusAreaSelector from "@/components/landing/FocusAreaSelector";
import Hero from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksStep";
import PricingCard from "@/components/landing/PricingCard";
import { TestimonialsSection } from "@/components/landing/TestimonialCard";
import TrustStrip from "@/components/landing/TrustStrip";
import WhyWriteWiseStats from "@/components/landing/WhyWriteWiseStats";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import { PRICING_PLANS } from "@/lib/pricing";

/**
 * WriteWise landing page.
 *
 * Section order follows the `writewise` Figma frame (node 1001:2) read top-to-bottom by
 * y-position, which is worth stating because it differs from the order tasks.md
 * assumed: the design puts the bold CTA band *before* the FAQ, not after it.
 *
 * The reference's "SocialProof" strip is built as `TrustStrip`, but with its contents
 * replaced — see that file for why five real organisations' trademarks could not ship
 * here.
 *
 * The hero animates on mount; everything below it animates on entry. Each section is
 * given a *different* entrance — headings are cut in, cards are pasted down, body copy
 * rises — because a page where every block fades up by the same 24px reads as a
 * template regardless of how good the individual sections are.
 */

/** Alternating tilts, so the pricing row lands as a row of cards rather than a grid. */
const PRICING_TILT = [-1, 1, -1, 1];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />

        <Reveal variant="fade">
          <TrustStrip />
        </Reveal>

        <FocusAreaSelector />
        <HowItWorksSection />
        <WhyWriteWiseStats />
        <ComparisonTable />

        <section
          id="pricing"
          className="bg-gradient-to-br from-surface-container-low to-surface-container py-section-y"
        >
          <div className="mx-auto max-w-container px-margin-mobile">
            <Reveal variant="cut" className="flex flex-col items-center gap-6 text-center">
              <SectionLabel index={5} align="center">
                Pricing
              </SectionLabel>
              <h2 className="font-display text-display-xl-mobile text-on-surface md:text-display-xl">
                Choose your <em className="italic">plan</em>
              </h2>
              <p className="max-w-prose font-body text-body-xl font-medium text-on-surface-variant">
                Simple, transparent pricing. Invest in your score.
              </p>
            </Reveal>

            <RevealGroup
              each={0.09}
              className="mt-20 grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
              {PRICING_PLANS.map((plan, i) => (
                // The resting tilt is the animation's target, not a Tailwind class:
                // motion owns `transform` once it animates, so a `rotate-*` class would
                // be overwritten the moment the card lands. See lib/motion.ts.
                <RevealItem key={plan.name} rotate={PRICING_TILT[i % PRICING_TILT.length]}>
                  <PricingCard plan={plan} index={i} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        <TestimonialsSection />
        <FinalCta />
        <FaqTeaser />
      </main>
      <SiteFooter />
    </>
  );
}
