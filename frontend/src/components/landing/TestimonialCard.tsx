import { SketchArrow } from "@/components/ui/Icon";
import SectionLabel from "@/components/ui/SectionLabel";
import { Dot, Star } from "@/components/ui/Sticker";
import { TESTIMONIALS, type Testimonial } from "@/lib/testimonials";

/**
 * "What Students Think" — cloned from the reference's Testimonials section: one large
 * featured card carrying a hard black offset shadow and an oversized quote mark, with
 * the remaining testimonials in a tilted two-up grid beneath it.
 *
 * Replaces the old `ExpertReviewCard`/`LearnerReviewCard` split: the reference has one
 * testimonial shape, not two variants.
 *
 * The disclosure line under the heading is not decoration and must not be removed. The
 * quotes in `lib/testimonials.ts` are illustrative — no real learner said them. Named
 * testimonials without that line are fabricated endorsements, which is a different thing
 * from placeholder copy. The reference pairs each quote with a stock portrait; those are
 * photographs of real people who never used this product, so this build uses a lettered
 * monogram instead.
 */

/** Renders the quote with the reference's highlighter behind one phrase. */
function Quote({ testimonial, className }: { testimonial: Testimonial; className: string }) {
  const [before, ...rest] = testimonial.quote.split(testimonial.highlight);
  const after = rest.join(testimonial.highlight);

  return (
    <blockquote className={className}>
      &ldquo;{before}
      <mark className="bg-accent-yellow-soft px-2 text-on-surface">{testimonial.highlight}</mark>
      {after}&rdquo;
    </blockquote>
  );
}

function Attribution({
  testimonial,
  size,
}: {
  testimonial: Testimonial;
  size: "lg" | "sm";
}) {
  const avatar = size === "lg" ? "size-16 border-2" : "size-12 border";

  return (
    <figcaption className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-full border-ink bg-surface-dim font-body font-bold text-on-primary-fixed ${avatar}`}
      >
        {testimonial.name.charAt(0)}
      </span>
      <span className="font-body">
        <span
          className={
            size === "lg"
              ? "block text-body-xl font-black text-on-surface"
              : "block font-bold text-on-surface"
          }
        >
          {testimonial.name}
        </span>
        <span className="block text-body-sm text-on-surface-variant">{testimonial.track}</span>
      </span>
    </figcaption>
  );
}

export default function TestimonialCard({
  testimonial,
  tilt,
  backdrop,
  badge,
}: {
  testimonial: Testimonial;
  tilt: string;
  backdrop: string;
  badge: string;
}) {
  return (
    // `isolate` keeps the tinted backdrop between the section ground and the card;
    // pushing it to -z-10 without a stacking context drops it behind the section itself.
    <div className="relative isolate">
      <span
        aria-hidden="true"
        data-decoration
        data-tilt
        className={`absolute inset-0 -z-10 translate-x-2 translate-y-2 rounded-2xl ${backdrop}`}
      />
      <figure
        data-tilt
        className={`rounded-2xl border-2 border-ink bg-surface-container-lowest p-8 shadow-hairline ${tilt}`}
      >
        <div className="mb-6 flex items-start justify-between">
          <span
            data-tilt
            className={`rounded px-4 py-1 font-body text-body-lg font-bold ${badge}`}
          >
            {testimonial.progress}
          </span>
        </div>

        <Quote
          testimonial={testimonial}
          className="mb-8 font-body text-body-xl font-bold italic leading-relaxed text-on-surface"
        />

        <Attribution testimonial={testimonial} size="sm" />
      </figure>
    </div>
  );
}

export function TestimonialsSection() {
  const [featured, ...rest] = [
    ...TESTIMONIALS.filter((t) => t.featured),
    ...TESTIMONIALS.filter((t) => !t.featured),
  ];

  const SUPPORTING = [
    {
      tilt: "-rotate-2",
      backdrop: "bg-secondary-fixed-dim rotate-3",
      badge: "bg-secondary text-on-secondary -rotate-3",
    },
    {
      tilt: "rotate-1",
      backdrop: "bg-accent-yellow-soft -rotate-2",
      badge: "bg-[#facc15] text-on-surface rotate-2",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-surface py-24">
      <div className="mx-auto max-w-container px-margin-mobile">
        <div className="mb-16 text-center">
          <SectionLabel index={6} align="center" className="mb-4">
            Learners
          </SectionLabel>
          <h2 className="mb-4 font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            What <em className="italic">Students</em> Think
          </h2>
          <p className="mx-auto max-w-xl font-body text-body-lg text-on-surface-variant">
            Real students. Real essays. Real progress.
          </p>
          <p className="mx-auto mt-2 max-w-xl font-body text-body-sm text-on-surface-variant">
            Illustrative examples pending verified learner feedback — not collected reviews.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-6xl">
          {featured && (
            <div className="relative z-20 mb-16 lg:mb-24">
              <figure className="relative overflow-hidden rounded-2xl border-2 border-ink bg-surface-container-lowest p-10 shadow-brutal-lg lg:p-16">
                <span
                  aria-hidden="true"
                  data-decoration
                  className="pointer-events-none absolute -left-2 -top-4 select-none font-display text-[12rem] leading-none text-[#facc15] opacity-30"
                >
                  &ldquo;
                </span>

                <div className="relative z-10">
                  <span
                    data-tilt
                    className="mb-8 inline-block -rotate-2 rounded-full bg-tertiary px-6 py-2 font-body text-headline-sm font-black text-on-tertiary shadow-hairline"
                  >
                    {featured.progress}
                  </span>

                  <Quote
                    testimonial={featured}
                    className="mb-8 font-display text-display-lg-mobile font-bold leading-tight text-on-surface md:text-[42px] md:leading-[1.15]"
                  />

                  <Attribution testimonial={featured} size="lg" />
                </div>

                <Star className="absolute right-10 top-10 size-16 text-[#facc15] opacity-20" />
              </figure>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            {rest.map((testimonial, i) => (
              <div key={testimonial.name} className={i === 1 ? "mt-8 lg:mt-16" : ""}>
                <TestimonialCard testimonial={testimonial} {...SUPPORTING[i % 2]} />
                {i === 1 && (
                  <SketchArrow className="absolute -bottom-12 -left-16 hidden size-24 text-primary opacity-40 lg:block" />
                )}
              </div>
            ))}
          </div>

          <Dot className="absolute -right-8 top-1/3 size-10 bg-secondary opacity-40" />
        </div>
      </div>
    </section>
  );
}
