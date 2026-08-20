"use client";

/**
 * Scored result panel (002 T028, FR-005).
 *
 * ── What this renders, and what it deliberately does not ────────────────────────────
 *
 * `learner_workspace` (and spec FR-005) describe an "expandable line-by-line feedback
 * list where each item shows the quoted sentence, a category tag, and a suggested
 * correction or a note of praise."
 *
 * `001`'s API returns no such structure. Checked against
 * `backend/src/schemas/assessment.py`, an AssessmentResult is:
 *
 *     { submission_id, overall_band, criteria[], created_at }
 *     criteria[i] = { criterion, band, explanation, evidence_quotes[], descriptor_reference? }
 *
 * Three of the four requested pieces exist and are rendered from real data: the quoted
 * sentence (`evidence_quotes`, verified verbatim server-side), the category tag
 * (`criterion`), and the reasoning (`explanation`). The fourth — a per-sentence
 * suggested correction — has no field, because `001` scores essays and does not rewrite
 * them. Synthesising one in the browser would put teaching advice in front of a learner
 * that no model was ever asked to produce and no rubric grounds, which is precisely the
 * failure `001`'s evidence-anchoring exists to prevent.
 *
 * The spec is internally consistent with that reading: FR-003 lists "Learn the fix" —
 * sentence-level corrections — as a not-yet-built capability. So the landing page marks
 * it "coming soon" and this panel shows what today's API can actually justify.
 */

import { useState } from "react";

import {
  CRITERION_LABELS,
  type AssessmentResult as Result,
  type CriterionCode,
  type CriterionScore,
} from "@/lib/apiClient";

const BAND_MAX = 9;

/** IELTS reports one decimal place — "7" would read as a different, vaguer claim. */
function formatBand(band: number): string {
  return band.toFixed(1);
}

function CriterionCard({
  score,
  open,
  onToggle,
}: {
  score: CriterionScore;
  open: boolean;
  onToggle: () => void;
}) {
  const label = CRITERION_LABELS[score.criterion] ?? score.criterion;
  const panelId = `criterion-panel-${score.criterion}`;

  return (
    <div
      data-testid="criterion-card"
      className="rounded-lg border border-outline-variant bg-surface-container-lowest"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full flex-col gap-stack-sm p-4 text-left"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-body text-body-sm font-medium text-on-surface">{label}</span>
          <span className="font-display text-headline-sm text-secondary tabular-nums">
            {formatBand(score.band)}
          </span>
        </span>

        {/*
          A real <meter>-role element rather than a decorative bar: the proportion is
          information, and a div whose only signal is its width is invisible to a screen
          reader.
        */}
        <span
          role="meter"
          aria-label={`${label} band`}
          aria-valuenow={score.band}
          aria-valuemin={0}
          aria-valuemax={BAND_MAX}
          aria-valuetext={`Band ${formatBand(score.band)} out of ${BAND_MAX}`}
          className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high"
        >
          <span
            aria-hidden="true"
            className="block h-full rounded-full bg-secondary"
            style={{ width: `${Math.min(100, (score.band / BAND_MAX) * 100)}%` }}
          />
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-outline-variant p-4">
          <p className="font-body text-body-sm text-on-surface">{score.explanation}</p>

          {score.evidence_quotes.length > 0 && (
            <ul data-testid="evidence-list" className="mt-stack-sm flex flex-col gap-2">
              {score.evidence_quotes.map((quote, i) => (
                <li key={i}>
                  <blockquote className="border-l-2 border-secondary pl-3 font-body text-body-sm italic text-on-surface-variant">
                    “{quote}”
                  </blockquote>
                </li>
              ))}
            </ul>
          )}

          {score.descriptor_reference && (
            <p className="mt-stack-sm text-label-caps uppercase text-on-surface-variant">
              {score.descriptor_reference}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssessmentResult({
  result,
  defaultOpen,
}: {
  result: Result;
  /** Pre-expanded criterion. Used by tests and deep links; not a UI affordance. */
  defaultOpen?: CriterionCode;
}) {
  const [openCriteria, setOpenCriteria] = useState<Set<string>>(
    () => new Set(defaultOpen ? [defaultOpen] : []),
  );

  // Multiple panels may be open at once. Unlike the FAQ's single-open rule (FR-016),
  // nothing here asks for that, and forcing it would stop a learner comparing two
  // criteria side by side — the main reason to open them at all.
  function toggle(criterion: string) {
    setOpenCriteria((current) => {
      const next = new Set(current);
      if (!next.delete(criterion)) next.add(criterion);
      return next;
    });
  }

  return (
    <section aria-label="Assessment result" className="flex flex-col gap-stack-md">
      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-6 text-center">
        <p className="text-label-caps uppercase text-on-surface-variant">Overall band</p>
        <p
          data-testid="overall-band"
          className="mt-stack-sm font-display text-display-lg-mobile text-secondary tabular-nums"
        >
          {formatBand(result.overall_band)}
        </p>
      </div>

      <div className="grid gap-gutter sm:grid-cols-2">
        {result.criteria.map((score) => (
          <CriterionCard
            key={score.criterion}
            score={score}
            open={openCriteria.has(score.criterion)}
            onToggle={() => toggle(score.criterion)}
          />
        ))}
      </div>

      <p className="font-body text-body-sm text-on-surface-variant">
        Each band is explained against the published IELTS descriptors and quoted from your
        own essay. This is an AI-generated practice estimate, not an official IELTS result.
      </p>
    </section>
  );
}
