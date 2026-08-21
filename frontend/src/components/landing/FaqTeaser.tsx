import { FAQ_TEASER_ITEMS } from "@/lib/faqTeaser";

/**
 * The inline FAQ teaser — cloned from the reference's FAQ section: numbered rows on a
 * light panel, with a plus that swaps to a minus when the row opens.
 *
 * Built on native `<details>`/`<summary>` exactly as the reference is. Independent
 * expand/collapse (FR-020) and keyboard operation come for free and correctly, it stays
 * a server component, and it works before hydration.
 *
 * The answers are this project's own (`lib/faqTeaser.ts`), not the reference's. Two of
 * the reference's three make claims 001 cannot back: "within 0.5 bands of official
 * examiner ratings" is a precision figure nobody here has measured, and "specific
 * explanations for each" overstates what the grader returns while TP-1 is open.
 */
export default function FaqTeaser() {
  return (
    <section id="faq" className="bg-surface-container-lowest py-24">
      <div className="mx-auto max-w-4xl px-margin-mobile">
        <div className="mb-16 text-center">
          <h2 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
            Questions? <em className="italic">We&rsquo;ve Got Answers.</em>
          </h2>
        </div>

        <div className="space-y-6">
          {FAQ_TEASER_ITEMS.map((item, i) => (
            <details
              key={item.question}
              className="group rounded-lg border border-outline-variant bg-surface-variant [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-on-surface">
                <h3 className="flex items-center font-display text-body-lg font-semibold">
                  <span aria-hidden="true" className="mr-4 text-body-xl font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.question}
                </h3>

                <span aria-hidden="true" className="relative size-5 shrink-0">
                  <svg
                    className="absolute inset-0 size-5 opacity-100 transition-opacity group-open:opacity-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg
                    className="absolute inset-0 size-5 opacity-0 transition-opacity group-open:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 12H4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </summary>

              <p className="mt-4 px-6 pb-6 pl-14 font-body text-body-md leading-relaxed text-on-surface-variant">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
