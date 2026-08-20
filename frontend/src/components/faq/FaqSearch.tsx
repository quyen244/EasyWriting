"use client";

/**
 * FAQ search input and its filter (002 T040, FR-014).
 *
 * The filter is exported separately from the component so the matching rule can be
 * tested against the real content without going through the DOM.
 */

import type { FaqEntry } from "@/lib/faqData";

/**
 * Matches against question AND answer text. A visitor searching for "certified" or
 * "refund" is searching for a concept, and the word they remember is as often in the
 * answer as in the question.
 */
export function filterFaqEntries(entries: FaqEntry[], term: string): FaqEntry[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter(
    (entry) =>
      entry.question.toLowerCase().includes(needle) ||
      entry.answer.toLowerCase().includes(needle),
  );
}

export default function FaqSearch({
  value,
  onChange,
  resultCount,
}: {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
}) {
  const searching = value.trim().length > 0;

  return (
    <div>
      <label htmlFor="faq-search" className="block text-label-caps uppercase text-on-surface-variant">
        Search the FAQ
      </label>
      <input
        id="faq-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Try “official”, “password”, or “Task 1”"
        className="mt-1 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body text-body-md text-on-surface focus:border-primary"
      />

      {/* Rendered only while searching: an always-present live region would announce a
          count nobody asked for on page load. */}
      {searching && (
        <p
          role="status"
          aria-live="polite"
          className="mt-stack-sm font-body text-body-sm text-on-surface-variant"
        >
          {resultCount === 0
            ? "No questions match that search."
            : `${resultCount} question${resultCount === 1 ? "" : "s"} match.`}
        </p>
      )}
    </div>
  );
}
