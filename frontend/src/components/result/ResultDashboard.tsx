"use client";

/**
 * The graded result.
 *
 * One component renders every result the product produces — inline after grading, on a
 * stored result's own route, and inside a mock test. Two implementations of this would
 * be two chances for a history row to disagree with the result it opens.
 *
 * It renders whatever criteria the payload carries, in payload order, and never assumes
 * four fixed labels: Task 1 arrives with Task Achievement where Task 2 has Task Response,
 * and hardcoding either would print a criterion the learner was not scored on.
 *
 * Everything interpretive on this screen — strongest, weakest, the recommendation, the
 * word delta — is derived from the four bands by `lib/api/insights`, not sent by the
 * service. A server-supplied "strongest" beside a lower band is the kind of contradiction
 * a learner spots once and never trusts again.
 */

import { useState, type ReactNode } from "react";

import { BandBar, BandDial } from "@/components/result/BandMeter";
import { Card, Pill, SectionHeading } from "@/components/app/Primitives";
import { useLocale } from "@/hooks/useLocale";
import {
  criterionLabel,
  keyRecommendation,
  strongestCriterion,
  weakestCriterion,
  wordStatus,
  type GradingCriterion,
  type GradingResult,
} from "@/lib/api";

export default function ResultDashboard({
  result,
  actions,
}: {
  result: GradingResult;
  /** Try again / Improve essay / Practice weak area / Back — supplied by the page. */
  actions?: ReactNode;
}) {
  const { t, locale, formatBand, formatNumber, formatDateTime } = useLocale();

  const strongest = strongestCriterion(result.criteria);
  const weakest = weakestCriterion(result.criteria);
  const recommendation = keyRecommendation(result.criteria);
  const words = wordStatus(result);

  const label = (criterion: GradingCriterion) => criterionLabel(criterion.code, locale);

  return (
    <section aria-label={t("result.eyebrow")} className="flex flex-col gap-6">
      {/* ── Overall band ──────────────────────────────────────────────────── */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <BandDial
            band={result.overall_band}
            label={t("result.overallBand")}
            valueText={t("result.bandOutOf", { band: formatBand(result.overall_band) })}
          >
            <span
              data-testid="overall-band"
              className="font-display text-display-xl-mobile leading-none text-on-surface tabular-nums"
            >
              {formatBand(result.overall_band)}
            </span>
            <span className="mt-1 text-mono-caps uppercase text-on-surface-variant">
              / 9
            </span>
          </BandDial>

          <div className="min-w-0 flex-1 text-center sm:text-start">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <p className="text-mono-caps uppercase text-on-surface-variant">
                {t("result.estimatedBand")}
              </p>
              {result.provisional && (
                <Pill tone="warning">{t("result.provisional")}</Pill>
              )}
              <Pill tone="info">
                {result.task_type === "TASK_1" ? t("grader.task1") : t("grader.task2")}
              </Pill>
            </div>

            <p className="mt-3 font-body text-body-md text-on-surface-variant">
              {result.provisional ? t("result.provisionalHelp") : t("result.disclaimer")}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-start sm:max-w-md">
              <Insight
                term={t("result.strongest")}
                value={strongest ? label(strongest) : "—"}
                band={strongest ? formatBand(strongest.band) : undefined}
                tone="positive"
              />
              <Insight
                term={t("result.needsWork")}
                value={weakest ? label(weakest) : "—"}
                band={weakest ? formatBand(weakest.band) : undefined}
                tone="warning"
              />
            </dl>
          </div>
        </div>

        {recommendation && (
          <div className="mt-6 rounded-md border border-primary/30 bg-primary-fixed p-4">
            <p className="text-mono-caps uppercase text-on-primary-fixed-variant">
              {t("result.keyRecommendation")}
            </p>
            <p className="mt-1.5 font-body text-body-md text-on-primary-fixed">
              {recommendation}
            </p>
          </div>
        )}
      </Card>

      {/* ── Criterion scores ──────────────────────────────────────────────── */}
      <section aria-label={t("result.criteriaTitle")}>
        <SectionHeading>{t("result.criteriaTitle")}</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.criteria.map((criterion) => (
            <Card key={criterion.code} className="p-4" as="article">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="min-w-0 font-body text-body-sm font-semibold text-on-surface">
                  {label(criterion)}
                </h3>
                <span className="font-display text-headline-sm tabular-nums text-on-surface">
                  {formatBand(criterion.band)}
                </span>
              </div>
              <div className="mt-3">
                <BandBar
                  band={criterion.band}
                  label={label(criterion)}
                  valueText={t("result.bandOutOf", { band: formatBand(criterion.band) })}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Detailed feedback ─────────────────────────────────────────────── */}
      <section aria-label={t("result.detailTitle")}>
        <SectionHeading>{t("result.detailTitle")}</SectionHeading>
        <div className="flex flex-col gap-3">
          {result.criteria.map((criterion) => (
            <CriterionDetail
              key={criterion.code}
              criterion={criterion}
              label={label(criterion)}
              weakest={weakest?.code === criterion.code}
            />
          ))}
        </div>
      </section>

      {/* ── Writing statistics ────────────────────────────────────────────── */}
      <section aria-label={t("result.statsTitle")}>
        <SectionHeading>{t("result.statsTitle")}</SectionHeading>
        <Card className="grid gap-px overflow-hidden bg-outline-variant sm:grid-cols-2 lg:grid-cols-4">
          <StatCell
            label={t("result.statWordCount")}
            value={formatNumber(words.count)}
            hint={
              words.meetsMinimum
                ? words.delta === 0
                  ? t("result.statMet")
                  : t("result.statSurplus", { count: formatNumber(words.delta) })
                : t("result.statShortage", { count: formatNumber(-words.delta) })
            }
            warn={!words.meetsMinimum}
          />
          <StatCell
            label={t("result.statMinWords")}
            value={formatNumber(words.minimum)}
          />
          <StatCell
            label={t("result.statPenalty")}
            value={
              result.length_penalty > 0
                ? t("result.statPenaltyApplied", { value: formatBand(result.length_penalty) })
                : t("result.statPenaltyNone")
            }
            hint={result.length_penalty > 0 ? t("result.statPenaltyHelp") : undefined}
            warn={result.length_penalty > 0}
          />
          <StatCell
            label={t("result.statTaskType")}
            value={result.task_type === "TASK_1" ? t("grader.task1") : t("grader.task2")}
          />
        </Card>
      </section>

      {actions && (
        <section aria-label={t("result.actionsTitle")}>
          <SectionHeading>{t("result.actionsTitle")}</SectionHeading>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </section>
      )}

      {/* ── Metadata, deliberately quiet ──────────────────────────────────── */}
      <details className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
        <summary className="cursor-pointer font-body text-body-sm text-on-surface-variant">
          {t("result.metaTitle")}
        </summary>
        <dl className="mt-3 grid gap-2 font-body text-[12px] text-on-surface-variant sm:grid-cols-3">
          <div>
            <dt className="uppercase tracking-wide">{t("result.metaPipeline")}</dt>
            <dd className="mt-0.5 text-on-surface">{result.pipeline_version}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">{t("result.metaModel")}</dt>
            <dd className="mt-0.5 break-words text-on-surface">{result.model_id}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">{t("result.metaScoredAt")}</dt>
            <dd className="mt-0.5 text-on-surface">{formatDateTime(result.scored_at)}</dd>
          </div>
        </dl>
      </details>

      <p className="font-body text-body-sm text-on-surface-variant">
        {t("result.disclaimer")}
      </p>
    </section>
  );
}

function Insight({
  term,
  value,
  band,
  tone,
}: {
  term: string;
  value: string;
  band?: string;
  tone: "positive" | "warning";
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        tone === "positive"
          ? "border-tertiary/30 bg-tertiary-container/50"
          : "border-error/30 bg-error-container/40"
      }`}
    >
      <dt className="text-mono-caps uppercase text-on-surface-variant">{term}</dt>
      <dd className="mt-1 font-body text-body-sm font-semibold text-on-surface">
        {value}
        {band && <span className="ms-1.5 tabular-nums font-normal">({band})</span>}
      </dd>
    </div>
  );
}

function StatCell({
  label,
  value,
  hint,
  warn = false,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest p-4">
      <p className="text-mono-caps uppercase text-on-surface-variant">{label}</p>
      <p
        className={`mt-1 font-display text-headline-sm tabular-nums ${
          warn ? "text-error" : "text-on-surface"
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 font-body text-[12px] text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}

/**
 * One criterion's full feedback.
 *
 * Multiple panels may be open at once: nothing here asks for a single-open accordion,
 * and forcing one would stop a learner comparing two criteria side by side, which is the
 * main reason to open them.
 *
 * The weakest criterion starts open. It is the one the recommendation points at, and
 * making the learner hunt for it undoes the work the insight block just did.
 */
function CriterionDetail({
  criterion,
  label,
  weakest,
}: {
  criterion: GradingCriterion;
  label: string;
  weakest: boolean;
}) {
  const { t, formatBand } = useLocale();
  const [open, setOpen] = useState(weakest);
  const panelId = `criterion-panel-${criterion.code}`;

  return (
    <Card data-testid="criterion-card" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-surface-container-low"
      >
        <span className="flex-1 font-body text-body-md font-semibold text-on-surface">
          {label}
        </span>
        {weakest && <Pill tone="warning">{t("result.needsWork")}</Pill>}
        <span className="font-display text-headline-sm tabular-nums text-on-surface">
          {formatBand(criterion.band)}
        </span>
        <span className="font-body text-[12px] text-on-surface-variant">
          {open ? t("result.collapse") : t("result.expand")}
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-outline-variant p-4">
          <p className="text-mono-caps uppercase text-on-surface-variant">
            {t("result.whyThisBand")}
          </p>
          <p className="mt-1.5 font-body text-body-md text-on-surface">
            {criterion.comment}
          </p>

          <p className="mt-4 text-mono-caps uppercase text-on-surface-variant">
            {t("result.howToImprove")}
          </p>
          <p className="mt-1.5 font-body text-body-md text-on-surface">
            {criterion.improvement}
          </p>

          {criterion.evidence_quotes.length > 0 && (
            <>
              <p className="mt-4 text-mono-caps uppercase text-on-surface-variant">
                {t("result.fromYourEssay")}
              </p>
              <ul data-testid="evidence-list" className="mt-1.5 flex flex-col gap-2">
                {criterion.evidence_quotes.map((quote, index) => (
                  <li key={index}>
                    <blockquote className="border-s-2 border-primary/60 ps-3 font-body text-body-sm italic text-on-surface-variant">
                      “{quote}”
                    </blockquote>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
