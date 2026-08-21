import { FAQ_TEASER_ITEMS } from "@/lib/faqTeaser";

/**
 * The inline FAQ teaser (Figma node 1001:275).
 *
 * Built on native `<details>`/`<summary>` rather than a JS accordion: independent
 * expand/collapse (FR-020) and keyboard operation come for free and correctly, this
 * stays a server component, and it works before hydration. The design's own frame shows
 * three collapsed rows with a plus icon and no answer copy at all — the answers come
 * from `lib/faqTeaser.ts` (research.md R6).
 */
export default function FaqTeaser() {
  return (
    <section id="faq" className="bg-surface-container-lowest py-section-y">
      <div className="mx-auto max-w-4xl px-margin-mobile">
        <h2 className="text-center font-display text-display-lg-mobile text-on-surface md:text-display-lg">
          Questions? <em className="italic">We&rsquo;ve Got Answers.</em>
        </h2>

        <div className="mt-16 flex flex-col gap-6">
          {FAQ_TEASER_ITEMS.map((item, i) => (
            <details
              key={item.question}
              className="group rounded-lg border border-outline-variant bg-surface-variant"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-6 marker:content-none">
                <span className="flex items-center gap-4">
                  <span aria-hidden="true" className="font-display text-body-xl font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-body-lg font-bold text-on-surface">
                    {item.question}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 font-body text-body-xl text-on-surface-variant transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 font-body text-body-md text-on-surface-variant">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
