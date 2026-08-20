"use client";

/**
 * One FAQ category as a single-open accordion (002 T041, FR-016).
 *
 * Open state is owned by the page, not by this component. FR-016 scopes "one open at a
 * time" to a category, and a component holding its own open id could not express that
 * boundary — every category would independently think it was in charge.
 */

import type { FaqCategory, FaqEntry } from "@/lib/faqData";

export default function FaqAccordionCategory({
  category,
  entries,
  openId,
  onToggle,
}: {
  category: FaqCategory;
  entries: FaqEntry[];
  openId: string | null;
  onToggle: (id: string) => void;
}) {
  // A search that filtered everything out of this category must render nothing at all;
  // three bare headings with no questions under them read as a broken page.
  if (entries.length === 0) return null;

  return (
    <section className="py-stack-md">
      <h2 className="font-display text-headline-sm text-on-surface">{category}</h2>

      <div className="mt-stack-sm divide-y divide-outline-variant border-y border-outline-variant">
        {entries.map((entry) => {
          const open = openId === entry.id;
          const panelId = `faq-panel-${entry.id}`;

          return (
            <div key={entry.id}>
              <h3>
                <button
                  type="button"
                  onClick={() => onToggle(entry.id)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left font-body text-body-md text-on-surface"
                >
                  {entry.question}
                  <span aria-hidden="true" className="shrink-0 text-on-surface-variant">
                    {open ? "−" : "+"}
                  </span>
                </button>
              </h3>

              {open && (
                <div id={panelId} className="pb-4">
                  <p className="font-body text-body-md text-on-surface-variant">
                    {entry.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
