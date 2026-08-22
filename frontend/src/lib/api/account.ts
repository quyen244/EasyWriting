/**
 * Account calls: history, progress and activity.
 *
 * Progress is *derived from history here*, not stored as its own fixture. That is the
 * whole reason the numbers on the progress dashboard can be trusted: an average that was
 * itself a fixture would eventually disagree with the list of essays printed beside it,
 * and the learner would have no way to tell which one was lying.
 */

import { translate, type Locale } from "@/lib/i18n";
import { findModule } from "@/mockData/practice";
import { text } from "@/mockData/localized";

import {
  LATENCY,
  allMockAttempts,
  allPracticeSessions,
  allStoredResults,
  delay,
  overallBandOf,
  type StoredResult,
} from "./store";
import {
  CRITERIA_BY_TASK,
  type ActivityEntry,
  type CriterionAverage,
  type CriterionCode,
  type HistoryEntry,
  type ProgressSummary,
  type TaskType,
  type WeeklyVolume,
} from "./types";

const PROMPT_EXCERPT_LENGTH = 120;

function excerpt(value: string | null): string {
  if (!value) return "";
  if (value.length <= PROMPT_EXCERPT_LENGTH) return value;
  return `${value.slice(0, PROMPT_EXCERPT_LENGTH).trimEnd()}…`;
}

function toHistoryEntry(stored: StoredResult): HistoryEntry {
  return {
    id: stored.id,
    result_id: stored.id,
    task_type: stored.task_type,
    prompt_excerpt: excerpt(stored.prompt_text),
    overall_band: overallBandOf(stored),
    word_count: stored.word_count,
    provisional: stored.provisional,
    source: stored.source,
    created_at: stored.created_at,
  };
}

/** Newest first — a history is read from the top. */
export async function getHistory(): Promise<HistoryEntry[]> {
  await delay(LATENCY.read);
  return allStoredResults()
    .map(toHistoryEntry)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function averageFor(results: StoredResult[], taskType?: TaskType): number | null {
  const scoped = taskType ? results.filter((r) => r.task_type === taskType) : results;
  const value = mean(scoped.map(overallBandOf));
  return value === null ? null : round1(value);
}

/**
 * Per-criterion averages across every submission that was scored on that criterion.
 *
 * Task Achievement and Task Response are averaged over Task 1 and Task 2 submissions
 * respectively — never pooled. They are different criteria measuring different things,
 * and a single "task criterion" average would be a number about nothing.
 */
function criterionAverages(results: StoredResult[]): CriterionAverage[] {
  const buckets = new Map<CriterionCode, number[]>();

  for (const stored of results) {
    for (const code of CRITERIA_BY_TASK[stored.task_type]) {
      const bucket = buckets.get(code) ?? [];
      bucket.push(stored.bands[code]);
      buckets.set(code, bucket);
    }
  }

  return [...buckets.entries()]
    .map(([code, bands]) => ({
      code,
      average: round1(mean(bands) ?? 0),
      sample_size: bands.length,
    }))
    .sort((a, b) => b.average - a.average);
}

function isoWeekStart(iso: string): string {
  const date = new Date(iso);
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function weeklyVolume(results: StoredResult[]): WeeklyVolume[] {
  const weeks = new Map<string, WeeklyVolume>();
  for (const stored of results) {
    const key = isoWeekStart(stored.created_at);
    const current = weeks.get(key) ?? { week_start: key, words: 0, submissions: 0 };
    current.words += stored.word_count;
    current.submissions += 1;
    weeks.set(key, current);
  }
  return [...weeks.values()].sort((a, b) => a.week_start.localeCompare(b.week_start));
}

export async function getProgress(): Promise<ProgressSummary> {
  await delay(LATENCY.read);

  const results = allStoredResults();
  const averages = criterionAverages(results);
  const overalls = results.map(overallBandOf);

  // "Recent" is the latest submission against the mean of everything before it. With one
  // submission there is no "before", so the change is null rather than zero — zero would
  // claim the learner had held steady, which is a different statement.
  const recentChange =
    overalls.length >= 2
      ? round1(overalls[overalls.length - 1] - (mean(overalls.slice(0, -1)) ?? 0))
      : null;

  const activeDays = new Set<string>();
  for (const stored of results) activeDays.add(stored.created_at.slice(0, 10));
  for (const session of allPracticeSessions()) activeDays.add(session.at.slice(0, 10));

  return {
    overall_average: averageFor(results),
    task1_average: averageFor(results, "TASK_1"),
    task2_average: averageFor(results, "TASK_2"),
    recent_change: recentChange,
    strongest: averages[0] ?? null,
    weakest: averages[averages.length - 1] ?? null,
    criterion_averages: averages,
    band_trend: results.map((stored) => ({
      date: stored.created_at,
      band: overallBandOf(stored),
      task_type: stored.task_type,
      result_id: stored.id,
    })),
    weekly_volume: weeklyVolume(results),
    active_days: [...activeDays].sort(),
    total_words: results.reduce((sum, stored) => sum + stored.word_count, 0),
    total_submissions: results.length,
  };
}

export async function getActivity(locale: Locale, limit = 12): Promise<ActivityEntry[]> {
  await delay(LATENCY.read);

  const graded: ActivityEntry[] = allStoredResults()
    .filter((stored) => stored.source === "grader")
    .map((stored) => ({
      id: `act_${stored.id}`,
      kind: "graded",
      at: stored.created_at,
      href: `/results/${stored.id}`,
      task_type: stored.task_type,
      band: overallBandOf(stored),
    }));

  const practice: ActivityEntry[] = allPracticeSessions().map((session) => {
    const practiceModule = findModule(session.module_id);
    return {
      id: `act_${session.id}`,
      kind: "practice",
      at: session.at,
      href: `/practice/writing/${session.module_id}`,
      module_id: session.module_id,
      module_title: practiceModule ? text(practiceModule.title, locale) : session.module_id,
      progress: practiceModule
        ? {
            done: Math.min(session.completed, practiceModule.exercises.length),
            total: practiceModule.exercises.length,
          }
        : undefined,
    };
  });

  const mocks: ActivityEntry[] = allMockAttempts().map((attempt) => ({
    id: `act_${attempt.id}`,
    kind: "mock_test",
    at: attempt.submitted_at,
    href: `/results/${attempt.attempt_ids[0]}`,
  }));

  return [...graded, ...practice, ...mocks]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}

/** The label a criterion average carries in an activity or progress row. */
export function criterionAverageLabel(
  average: CriterionAverage,
  locale: Locale,
): string {
  return translate(locale, `criterion.${average.code}` as const);
}
