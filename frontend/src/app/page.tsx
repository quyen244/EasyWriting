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
import WhyWriteWiseStats from "@/components/landing/WhyWriteWiseStats";
import { PRICING_PLANS } from "@/lib/pricing";

/**
 * WriteWise landing page.
 *
 * Section order follows the `writewise` Figma frame (node 1001:2) read top-to-bottom by
 * y-position, which is worth stating because it differs from the order tasks.md
 * assumed: the design puts the bold CTA band *before* the FAQ, not after it.
 *
 * The design's "SocialProof" strip (five partner logos) is deliberately not built. Its
 * contents are placeholder marks for companies that have no relationship with this
 * product; rendering invented partner logos is a claim about other organisations, not a
 * layout detail. Bring it back when there are real logos and real permission.
 */
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <FocusAreaSelector />
        <HowItWorksSection />
        <WhyWriteWiseStats />
        <ComparisonTable />

        <section
          id="pricing"
          className="bg-gradient-to-br from-surface-container-low to-surface-container py-section-y"
        >
          <div className="mx-auto max-w-container px-margin-mobile">
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="font-display text-display-xl-mobile text-on-surface md:text-display-xl">
                Choose your <em className="italic">plan</em>
              </h2>
              <p className="max-w-prose font-body text-body-xl font-medium text-on-surface-variant">
                Simple, transparent pricing. Invest in your score.
              </p>
            </div>

            <div className="mt-20 grid items-center gap-8 lg:grid-cols-4">
              {PRICING_PLANS.map((plan) => (
                <PricingCard key={plan.name} plan={plan} />
              ))}
            </div>
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
