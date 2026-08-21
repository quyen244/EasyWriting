import { Star } from "@/components/ui/Sticker";
import { TESTIMONIALS, type Testimonial } from "@/lib/testimonials";

/**
 * "What Students Think" (Figma node 1001:194), rendered with the same card language the
 * rest of the page uses — black hairline border, hard offset shadow, alternating tilt.
 *
 * Replaces the old `ExpertReviewCard`/`LearnerReviewCard` split: the design has one
 * testimonial shape (quote, name, track), not two variants (research.md R1).
 *
 * The disclosure line under the heading is not decoration and must not be removed. The
 * quotes in `lib/testimonials.ts` are illustrative — no real learner said them. Named
 * testimonials without that line are fabricated endorsements, which is a different
 * thing from placeholder copy.
 */
export default function TestimonialCard({
  testimonial,
  tilt,
}: {
  testimonial: Testimonial;
  tilt: string;
}) {
  return (
    <figure
      data-tilt
      className={`flex h-full flex-col justify-between rounded-xl border-2 border-ink bg-surface-container-lowest p-8 shadow-brutal ${tilt}`}
    >
      <blockquote className="font-body text-body-lg text-on-surface">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-surface-dim font-body text-body-md font-bold text-on-primary-fixed"
        >
          {testimonial.name.charAt(0)}
        </span>
        <span className="font-body text-body-sm">
          <span className="block font-bold text-on-surface">{testimonial.name}</span>
          <span className="block text-on-surface-variant">{testimonial.track}</span>
        </span>
      </figcaption>
    </figure>
  );
}

const TILTS = ["-rotate-1", "rotate-1", "-rotate-1"];

export function TestimonialsSection() {
  return (
    <section className="py-section-y">
      <div className="mx-auto max-w-container px-margin-mobile">
        <div className="flex flex-col items-center gap-4 text-center">
          <Star className="size-8 text-[#facc15]" />
          <h2 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            What <em className="italic">Students Think</em>
          </h2>
          <p className="max-w-prose font-body text-body-sm text-on-surface-variant">
            Illustrative examples pending verified learner feedback — not collected reviews.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, i) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              tilt={TILTS[i % TILTS.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
