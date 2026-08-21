import { Dot, Star } from "@/components/ui/Sticker";
import { WHY_WRITEWISE_STATS, type StatCard } from "@/lib/whyWriteWise";

/**
 * "Why choose WriteWise?" — cloned from the reference's Why WriteWise section.
 *
 * The stats are a collage, not a grid: cards 2 and 4 drop half a card lower and each
 * card tilts a degree, which is what stops four equal boxes reading as a spec sheet.
 * The tilt is `data-tilt` so it flattens rather than vanishes under reduced motion,
 * since the cards carry the content.
 */

const TONE: Record<StatCard["tone"], { card: string; stat: string }> = {
  orange: { card: "bg-surface-container-lowest border-outline-variant", stat: "text-primary" },
  blue: { card: "bg-accent-blue-soft border-secondary-container", stat: "text-accent-blue" },
  green: { card: "bg-accent-green-soft border-tertiary-container", stat: "text-accent-green" },
  yellow: { card: "bg-accent-yellow-soft border-surface-container", stat: "text-accent-yellow" },
};

/** Reference layout: cards 2 and 4 sit lower; 1–3 tilt, 4 stays square. */
const OFFSET = ["-rotate-1", "-rotate-1 md:translate-y-8", "rotate-1", "md:translate-y-8"];

export default function WhyWriteWiseStats() {
  return (
    <section className="relative overflow-hidden py-24">
      <span
        aria-hidden="true"
        data-decoration
        className="absolute right-0 top-0 -z-10 hidden h-full w-1/3 rounded-l-full bg-surface-container-low opacity-50 lg:block"
      />

      <div className="mx-auto max-w-container px-margin-mobile">
        <div className="flex flex-col items-center gap-16 lg:flex-row">
          <div className="relative w-full lg:w-5/12">
            <span
              data-tilt
              data-decoration
              className="absolute -left-10 -top-10 hidden -rotate-12 rounded-md border-2 border-surface-container-lowest bg-inverse-surface px-4 py-2 font-accent text-[20px] text-inverse-on-surface shadow-card md:block"
            >
              Examiner Grade
            </span>

            <h2 className="mb-6 font-display text-display-lg-mobile leading-tight text-on-surface md:text-display-lg">
              <span className="text-primary">Why</span> choose
              <br />
              <em className="italic">WriteWise?</em>
            </h2>

            <p className="mb-8 font-body text-body-lg leading-relaxed text-on-surface-variant">
              Don&apos;t wait days for expensive tutors.{" "}
              <strong className="font-body font-extrabold italic text-tertiary">
                Get immediate, highly accurate feedback
              </strong>{" "}
              modeled on thousands of real examiner corrections.
            </p>

            <Star className="absolute bottom-10 right-10 size-8 text-[#facc15]" />
          </div>

          <div className="relative w-full lg:w-7/12">
            <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {WHY_WRITEWISE_STATS.map((card, i) => (
                <article
                  key={card.title}
                  data-tilt
                  className={`relative rounded-2xl border p-8 shadow-hairline transition-transform hover:-translate-y-1 ${TONE[card.tone].card} ${OFFSET[i]}`}
                >
                  <p className={`mb-2 font-body text-stat font-bold ${TONE[card.tone].stat}`}>
                    {card.stat}
                  </p>
                  <h3 className="mb-2 font-body text-body-lg font-bold text-on-surface">
                    {card.title}
                  </h3>
                  <p className="font-body text-body-sm text-on-surface-variant">{card.caption}</p>

                  {i === 1 && (
                    <Star className="absolute -right-6 -top-8 size-10 text-[#facc15]" />
                  )}
                  {i === 3 && (
                    <Dot className="absolute -right-4 -top-4 size-6 bg-secondary opacity-70" />
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
