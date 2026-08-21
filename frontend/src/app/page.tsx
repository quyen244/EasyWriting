import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ComparisonTable from "@/components/landing/ComparisonTable";
import FaqTeaser from "@/components/landing/FaqTeaser";
import FinalCta from "@/components/landing/FinalCta";
import FocusAreaSelector from "@/components/landing/FocusAreaSelector";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
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
 * The reference's "SocialProof" strip is built as `TrustStrip`, but with its contents
 * replaced — see that file for why five real organisations' trademarks could not ship
 * here.
 */
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
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

            <div className="mt-20 grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-4">
              {PRICING_PLANS.map((plan, i) => (
                <PricingCard key={plan.name} plan={plan} index={i} />
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
