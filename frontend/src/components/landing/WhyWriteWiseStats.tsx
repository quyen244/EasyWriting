import { Star } from "@/components/ui/Sticker";
import { WHY_WRITEWISE_STATS, type StatCard } from "@/lib/whyWriteWise";

/**
 * "Why choose WriteWise?" (Figma node 1001:324).
 *
 * A staggered collage of four stat cards, each tilted a degree in alternating
 * directions — the tilt is `data-tilt` so it flattens rather than disappears under
 * reduced motion, since the cards themselves carry the content.
 */

const TONE: Record<StatCard["tone"], { card: string; stat: string }> = {
  orange: { card: "bg-surface-container-lowest border-outline-variant", stat: "text-primary" },
  blue: { card: "bg-accent-blue-soft border-secondary-container", stat: "text-accent-blue" },
  green: { card: "bg-accent-green-soft border-tertiary-container", stat: "text-accent-green" },
  yellow: { card: "bg-accent-yellow-soft border-surface-container", stat: "text-accent-yellow" },
};

export default function WhyWriteWiseStats() {
  return (
    <section className="relative overflow-hidden py-section-y">
      <span
        aria-hidden="true"
        data-decoration
        className="absolute inset-y-0 left-2/3 right-0 rounded-l-full bg-surface-container-low opacity-50"
      />

      <div className="relative mx-auto grid max-w-container gap-16 px-margin-mobile lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
        <div className="relative">
          <span
            data-tilt
            data-decoration
            className="absolute -left-6 -top-12 hidden -rotate-12 rounded-md border-2 border-surface-container-lowest bg-inverse-surface px-4 py-2 font-accent text-[20px] text-inverse-on-surface shadow-brutal-sm lg:block"
          >
            Examiner Grade
          </span>

          <h2 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            <span className="text-primary">Why</span> choose{" "}
            <em className="italic">WriteWise?</em>
          </h2>

          <p className="mt-6 max-w-md font-body text-body-lg text-on-surface-variant">
            Don&apos;t wait days for expensive tutors.{" "}
            <strong className="font-body font-extrabold italic text-tertiary">
              Get immediate, highly accurate feedback
            </strong>{" "}
            modeled on thousands of real examiner corrections.
          </p>

          <Star className="mt-8 size-8 text-[#facc15]" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {WHY_WRITEWISE_STATS.map((card, i) => (
            <article
              key={card.title}
              data-tilt
              className={`rounded-xl border p-8 shadow-hairline ${TONE[card.tone].card} ${
                i % 2 === 0 ? "-rotate-1" : "rotate-1"
              }`}
            >
              <p className={`font-body text-stat font-bold ${TONE[card.tone].stat}`}>{card.stat}</p>
              <h3 className="mt-2 font-body text-body-lg font-bold text-on-surface">
                {card.title}
              </h3>
              <p className="mt-2 font-body text-body-sm text-on-surface-variant">{card.caption}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
