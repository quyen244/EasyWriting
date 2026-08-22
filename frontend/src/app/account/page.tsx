"use client";

/**
 * The account area: profile, progress, history and activity.
 *
 * One route with four sections rather than four routes, because they are four views of
 * the same thing — "how am I doing?" — and splitting them would put a page load between
 * a number and the list it came from.
 *
 * Every number on the progress tab is derived from the same history the history tab
 * lists, in the data client. That is what stops the average disagreeing with the essays
 * printed beside it.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import AppShell from "@/components/app/AppShell";
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Pill,
  SectionHeading,
  Stat,
} from "@/components/app/Primitives";
import {
  BandTrendChart,
  ConsistencyGrid,
  CriteriaComparisonChart,
  WritingVolumeChart,
} from "@/components/account/Charts";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  criterionLabel,
  getActivity,
  getHistory,
  getProgress,
  type ActivityEntry,
  type HistoryEntry,
  type ProgressSummary,
  type TaskType,
} from "@/lib/api";
import type { MessageKey } from "@/lib/i18n";

type Tab = "profile" | "progress" | "history" | "activity";

const TABS: { id: Tab; labelKey: MessageKey }[] = [
  { id: "progress", labelKey: "account.tabProgress" },
  { id: "history", labelKey: "account.tabHistory" },
  { id: "activity", labelKey: "account.tabActivity" },
  { id: "profile", labelKey: "account.tabProfile" },
];

function AccountView() {
  const router = useRouter();
  const params = useSearchParams();
  const { account, signOut } = useAuth();
  const { t, locale, formatBand, formatNumber, formatDate } = useLocale();

  const requested = params.get("tab");
  const [tab, setTab] = useState<Tab>(
    TABS.some((candidate) => candidate.id === requested) ? (requested as Tab) : "progress",
  );

  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[] | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskType | "ALL">("ALL");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getHistory(), getProgress(), getActivity(locale)]).then(
      ([loadedHistory, loadedProgress, loadedActivity]) => {
        if (!active) return;
        setHistory(loadedHistory);
        setProgress(loadedProgress);
        setActivity(loadedActivity);
      },
    );
    return () => {
      active = false;
    };
  }, [locale]);

  const loading = history === null || progress === null || activity === null;
  const empty = history !== null && history.length === 0;

  const filteredHistory =
    history?.filter((entry) => taskFilter === "ALL" || entry.task_type === taskFilter) ?? [];

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      router.replace("/signin");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t("account.eyebrow")}
        title={t("account.title")}
        description={account?.email}
      />

      <div role="tablist" aria-label={t("account.title")} className="mb-6 flex flex-wrap gap-1 border-b border-outline-variant">
        {TABS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={tab === candidate.id}
            onClick={() => setTab(candidate.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 font-body text-body-sm transition-colors ${
              tab === candidate.id
                ? "border-primary font-semibold text-on-surface"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t(candidate.labelKey)}
          </button>
        ))}
      </div>

      {loading && <LoadingState message={t("common.loading")} />}

      {!loading && empty && tab !== "profile" && (
        <EmptyState
          title={t("account.historyEmpty")}
          message={t("account.historyEmptyBody")}
          action={
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-md bg-primary-container px-4 py-2.5 font-body text-body-sm font-semibold text-on-primary-container transition-colors hover:bg-primary"
            >
              {t("account.historyEmptyCta")}
            </Link>
          }
        />
      )}

      {/* ── Progress ─────────────────────────────────────────────────────── */}
      {!loading && !empty && tab === "progress" && progress && (
        <div className="flex flex-col gap-8">
          <section aria-label={t("account.progressTitle")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label={t("account.overallAverage")}
                value={progress.overall_average === null ? "—" : formatBand(progress.overall_average)}
                hint={`${formatNumber(progress.total_submissions)} · ${formatNumber(progress.total_words)} ${t("common.words")}`}
              />
              <Stat
                label={t("account.task1Average")}
                value={progress.task1_average === null ? "—" : formatBand(progress.task1_average)}
              />
              <Stat
                label={t("account.task2Average")}
                value={progress.task2_average === null ? "—" : formatBand(progress.task2_average)}
              />
              <Stat
                label={t("account.recentImprovement")}
                value={
                  progress.recent_change === null
                    ? "—"
                    : `${progress.recent_change > 0 ? "+" : ""}${formatBand(progress.recent_change)}`
                }
                hint={
                  progress.recent_change === null
                    ? undefined
                    : progress.recent_change > 0
                      ? t("account.improvementUp", { value: formatBand(progress.recent_change) })
                      : progress.recent_change < 0
                        ? t("account.improvementDown", {
                            value: formatBand(Math.abs(progress.recent_change)),
                          })
                        : t("account.improvementFlat")
                }
                tone={progress.recent_change !== null && progress.recent_change < 0 ? "warning" : "neutral"}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {progress.strongest && (
                <Card className="border-tertiary/30 bg-tertiary-container/40 p-4">
                  <p className="text-mono-caps uppercase text-on-surface-variant">
                    {t("account.strongestCriterion")}
                  </p>
                  <p className="mt-1 font-body text-body-md font-semibold text-on-surface">
                    {criterionLabel(progress.strongest.code, locale)}{" "}
                    <span className="tabular-nums font-normal">
                      ({formatBand(progress.strongest.average)})
                    </span>
                  </p>
                </Card>
              )}
              {progress.weakest && (
                <Card className="border-error/30 bg-error-container/30 p-4">
                  <p className="text-mono-caps uppercase text-on-surface-variant">
                    {t("account.weakestCriterion")}
                  </p>
                  <p className="mt-1 font-body text-body-md font-semibold text-on-surface">
                    {criterionLabel(progress.weakest.code, locale)}{" "}
                    <span className="tabular-nums font-normal">
                      ({formatBand(progress.weakest.average)})
                    </span>
                  </p>
                  <Link
                    href="/practice/writing"
                    className="mt-2 inline-block font-body text-body-sm text-primary underline underline-offset-2"
                  >
                    {t("account.continuePractice")}
                  </Link>
                </Card>
              )}
            </div>
          </section>

          <BandTrendChart points={progress.band_trend} />

          <div className="grid gap-4 lg:grid-cols-2">
            <CriteriaComparisonChart averages={progress.criterion_averages} />
            <WritingVolumeChart weeks={progress.weekly_volume} />
          </div>

          <ConsistencyGrid activeDays={progress.active_days} />
        </div>
      )}

      {/* ── History ──────────────────────────────────────────────────────── */}
      {!loading && !empty && tab === "history" && (
        <section aria-label={t("account.historyTitle")}>
          <SectionHeading hint={t("practice.progress", { done: filteredHistory.length, total: history?.length ?? 0 })}>
            {t("account.historyTitle")}
          </SectionHeading>

          <div className="mb-4 flex flex-wrap gap-2">
            {(["ALL", "TASK_1", "TASK_2"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTaskFilter(option)}
                aria-pressed={taskFilter === option}
                className={`rounded-md border px-3 py-1.5 font-body text-body-sm transition-colors ${
                  taskFilter === option
                    ? "border-outline bg-surface-container font-semibold text-on-surface"
                    : "border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {option === "ALL"
                  ? t("account.filterAll")
                  : option === "TASK_1"
                    ? t("grader.task1")
                    : t("grader.task2")}
              </button>
            ))}
          </div>

          <ul className="flex flex-col gap-3">
            {filteredHistory.map((entry) => (
              <Card as="li" key={entry.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="info">
                        {entry.task_type === "TASK_1" ? t("grader.task1") : t("grader.task2")}
                      </Pill>
                      <Pill tone={entry.provisional ? "warning" : "positive"}>
                        {entry.provisional
                          ? t("account.statusProvisional")
                          : t("account.statusScored")}
                      </Pill>
                      <span className="font-body text-[12px] text-on-surface-variant">
                        {formatDate(entry.created_at)} ·{" "}
                        {formatNumber(entry.word_count)} {t("common.words")}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 font-body text-body-sm text-on-surface">
                      {entry.prompt_excerpt || "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-display text-headline-sm tabular-nums text-on-surface">
                      {formatBand(entry.overall_band)}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <Link
                        href={`/results/${entry.result_id}`}
                        className="rounded-md border border-outline-variant px-3 py-1.5 text-center font-body text-[12px] font-semibold text-on-surface transition-colors hover:border-outline"
                      >
                        {t("account.viewResult")}
                      </Link>
                      <Link
                        href="/workspace"
                        className="rounded-md px-3 py-1.5 text-center font-body text-[12px] text-on-surface-variant transition-colors hover:text-on-surface"
                      >
                        {t("account.retryPrompt")}
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        </section>
      )}

      {/* ── Activity ─────────────────────────────────────────────────────── */}
      {!loading && !empty && tab === "activity" && activity && (
        <section aria-label={t("account.activityTitle")}>
          <SectionHeading>{t("account.activityTitle")}</SectionHeading>
          <ul className="flex flex-col gap-2">
            {activity.map((entry) => (
              <Card as="li" key={entry.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="font-body text-[12px] tabular-nums text-on-surface-variant">
                  {formatDate(entry.at)}
                </span>
                <span className="min-w-0 flex-1 font-body text-body-sm text-on-surface">
                  {entry.kind === "graded"
                    ? t("account.activityGraded", {
                        task: entry.task_type === "TASK_1" ? t("grader.task1") : t("grader.task2"),
                      })
                    : entry.kind === "practice"
                      ? t("account.activityPractice", { module: entry.module_title ?? "" })
                      : t("account.activityMock")}
                  {entry.progress && (
                    <span className="ms-2 text-on-surface-variant">
                      ({t("practice.progress", {
                        done: entry.progress.done,
                        total: entry.progress.total,
                      })})
                    </span>
                  )}
                </span>
                {entry.band !== undefined && (
                  <span className="font-display text-body-lg tabular-nums text-on-surface">
                    {formatBand(entry.band)}
                  </span>
                )}
                <Link
                  href={entry.href}
                  className="rounded-md border border-outline-variant px-3 py-1.5 font-body text-[12px] font-semibold text-on-surface transition-colors hover:border-outline"
                >
                  {entry.kind === "practice" ? t("account.continuePractice") : t("account.viewResult")}
                </Link>
              </Card>
            ))}
          </ul>
        </section>
      )}

      {/* ── Profile ──────────────────────────────────────────────────────── */}
      {tab === "profile" && account && (
        <section aria-label={t("account.profileTitle")} className="max-w-xl">
          <SectionHeading>{t("account.profileTitle")}</SectionHeading>
          <Card className="divide-y divide-outline-variant">
            <Row label={t("account.displayName")} value={account.display_name || t("common.notAvailable")} />
            <Row label={t("account.email")} value={account.email} />
            <Row
              label={t("account.essaysGraded")}
              value={history ? formatNumber(history.length) : "—"}
            />
          </Card>

          <Button variant="secondary" className="mt-6" onClick={() => void handleSignOut()} disabled={signingOut}>
            {signingOut ? t("account.signingOut") : t("account.signOut")}
          </Button>
        </section>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 p-4">
      <span className="text-mono-caps uppercase text-on-surface-variant">{label}</span>
      <span className="font-body text-body-md text-on-surface">{value}</span>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      {/*
        `useSearchParams` opts the tree into client-side search-param reading, which Next
        requires a Suspense boundary around so the shell can still be prerendered.
      */}
      <Suspense fallback={null}>
        <AccountView />
      </Suspense>
    </ProtectedRoute>
  );
}
