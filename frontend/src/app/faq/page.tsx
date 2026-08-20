"use client";

/**
 * FAQ page (002 T042, US4).
 *
 * A first-class route rather than a landing-page anchor (research.md decision 6): the
 * search and per-category accordion behaviour do not survive being inlined as a section.
 *
 * Open state is `{ [category]: id | null }` per data-model.md, so FR-016's "one open per
 * category" holds without a category being able to close another category's answer.
 */

import { useMemo, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import FaqAccordionCategory from "@/components/faq/FaqAccordionCategory";
import FaqSearch, { filterFaqEntries } from "@/components/faq/FaqSearch";
import { FAQ_CATEGORIES, FAQ_ENTRIES, type FaqCategory } from "@/lib/faqData";

export default function FaqPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openByCategory, setOpenByCategory] = useState<Partial<Record<FaqCategory, string | null>>>(
    {},
  );

  const visible = useMemo(() => filterFaqEntries(FAQ_ENTRIES, searchTerm), [searchTerm]);

  function toggle(category: FaqCategory, id: string) {
    setOpenByCategory((current) => ({
      ...current,
      [category]: current[category] === id ? null : id,
    }));
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-margin-mobile py-stack-lg">
        <h1 className="font-display text-headline-md text-on-surface">
          Frequently asked questions
        </h1>
        <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
          What WriteWise does, what it does not do yet, and what its score is worth.
        </p>

        <div className="mt-stack-lg">
          <FaqSearch
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={visible.length}
          />
        </div>

        <div className="mt-stack-md">
          {FAQ_CATEGORIES.map((category) => (
            <FaqAccordionCategory
              key={category}
              category={category}
              entries={visible.filter((entry) => entry.category === category)}
              openId={openByCategory[category] ?? null}
              onToggle={(id) => toggle(category, id)}
            />
          ))}
        </div>

        {visible.length === 0 && (
          <p className="mt-stack-md font-body text-body-md text-on-surface-variant">
            Nothing matched “{searchTerm}”. Try a shorter term, or clear the search to
            browse every question.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
