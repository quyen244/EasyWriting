"use client";

/**
 * The Writing mock test.
 *
 * This is the one screen in the product that should not be decorated. No reveal
 * animations, no accent surfaces, no contextual panel competing with the answer column —
 * a learner sitting a timed hour needs the prompt, their text, the count and the clock,
 * and nothing else. Treat any motion added here as a defect.
 *
 * Three behaviours the exam depends on:
 *
 *  1. **Answers are held per task and never cleared by navigation.** Switching tasks is
 *     something a candidate does constantly; losing an answer to it would be fatal.
 *  2. **Expiry submits.** Running out of time is a normal exam outcome and must produce a
 *     result from whatever exists, not discard the hour.
 *  3. **Submitting asks first.** It is irreversible, and a misclick on a 40-minute essay
 *     is not a recoverable mistake.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/app/AppShell";
import {
  Button,
  Card,
  LoadingState,
  Pill,
  WordCount,
} from "@/components/app/Primitives";
import ProtectedRoute from "@/components/ProtectedRoute";
import ResultDashboard from "@/components/result/ResultDashboard";
import { useLocale } from "@/hooks/useLocale";
import {
  countWords,
  getMockTest,
  submitMockTest,
  type MockTest,
  type MockTestResult,
  type TaskType,
} from "@/lib/api";

type Phase = "brief" | "running" | "submitting" | "result";

/** Under five minutes the clock turns; that is when candidates need to triage. */
const WARNING_SECONDS = 5 * 60;

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function MockTestRunner() {
  const router = useRouter();
  const { t, locale, formatNumber, formatBand } = useLocale();

  const [test, setTest] = useState<MockTest | null>(null);
  const [phase, setPhase] = useState<Phase>("brief");
  const [activeTask, setActiveTask] = useState<TaskType>("TASK_1");
  const [answers, setAnswers] = useState<Record<TaskType, string>>({
    TASK_1: "",
    TASK_2: "",
  });
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<MockTestResult | null>(null);

  useEffect(() => {
    void getMockTest().then(setTest);
  }, []);

  const finish = useCallback(async () => {
    if (!test) return;
    setConfirming(false);
    setPhase("submitting");
    const elapsed = test.duration_minutes * 60 - (secondsLeft ?? 0);
    const marked = await submitMockTest(
      { test_id: test.id, answers, elapsed_seconds: elapsed },
      locale,
    );
    setResult(marked);
    setPhase("result");
  }, [answers, locale, secondsLeft, test]);

  // The countdown calls through a ref rather than depending on `finish` directly, so a
  // keystroke in the answer box cannot restart the one-second timer. The ref is written
  // in an effect, never during render.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    if (phase !== "running" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      void finishRef.current();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((current) => (current ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

  const tasks = useMemo(() => test?.tasks ?? [], [test]);
  const currentTask = tasks.find((task) => task.task_type === activeTask) ?? tasks[0];

  const counts = useMemo(
    () =>
      Object.fromEntries(
        tasks.map((task) => [task.task_type, countWords(answers[task.task_type] ?? "")]),
      ) as Record<TaskType, number>,
    [answers, tasks],
  );

  const completedTasks = tasks.filter(
    (task) => (counts[task.task_type] ?? 0) >= task.min_words,
  ).length;
  const incompleteTasks = tasks.length - completedTasks;

  if (!test || !currentTask) {
    return (
      <AppShell>
        <LoadingState message={t("common.loading")} />
      </AppShell>
    );
  }

  // ── Brief ────────────────────────────────────────────────────────────────
  if (phase === "brief") {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <p className="text-mono-caps uppercase text-primary">{t("mock.eyebrow")}</p>
          <h1 className="mt-2 font-display text-headline-md text-on-surface">
            {t("mock.writingTitle")}
          </h1>

          <Card className="mt-6 p-6">
            <h2 className="font-display text-headline-sm text-on-surface">
              {t("mock.briefTitle")}
            </h2>
            <p className="mt-3 font-body text-body-md text-on-surface-variant">
              {t("mock.briefBody")}
            </p>
            <ul className="mt-4 flex flex-col gap-2 font-body text-body-sm text-on-surface">
              <li>• {t("mock.briefTiming")}</li>
              <li>• {t("mock.briefNoPause")}</li>
            </ul>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {tasks.map((task) => (
                <div
                  key={task.task_type}
                  className="rounded-md border border-outline-variant p-4"
                >
                  <dt className="text-mono-caps uppercase text-on-surface-variant">
                    {task.task_type === "TASK_1" ? t("mock.taskOne") : t("mock.taskTwo")}
                  </dt>
                  <dd className="mt-1 font-body text-body-sm text-on-surface">
                    {formatNumber(task.min_words)} {t("common.words")} ·{" "}
                    {task.suggested_minutes} {t("common.minutes")}
                  </dd>
                </div>
              ))}
            </dl>

            <Button
              className="mt-6"
              onClick={() => {
                setSecondsLeft(test.duration_minutes * 60);
                setPhase("running");
              }}
            >
              {t("mock.startTest")}
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  // ── Marking ──────────────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <LoadingState message={t("mock.submitting")} />
        </div>
      </AppShell>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-8">
          <Card className="p-6 text-center">
            <p className="text-mono-caps uppercase text-on-surface-variant">
              {t("mock.combinedBand")}
            </p>
            <p className="mt-2 font-display text-display-xl-mobile tabular-nums text-on-surface">
              {formatBand(result.combined_band)}
            </p>
            <p className="mt-1 font-body text-body-sm text-on-surface-variant">
              {t("mock.combinedHelp")}
            </p>
            {secondsLeft !== null && secondsLeft <= 0 && (
              <p className="mt-4 font-body text-body-sm text-error">{t("mock.timeUpBody")}</p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={() => window.location.reload()}>{t("mock.newTest")}</Button>
              <Button variant="secondary" onClick={() => router.push("/account")}>
                {t("mock.backToDashboard")}
              </Button>
            </div>
          </Card>

          {result.results.map((taskResult) => (
            <section key={taskResult.id}>
              <h2 className="mb-3 font-display text-headline-sm text-on-surface">
                {t("mock.resultTaskLabel", {
                  task:
                    taskResult.task_type === "TASK_1" ? t("mock.taskOne") : t("mock.taskTwo"),
                })}
              </h2>
              <ResultDashboard result={taskResult} />
            </section>
          ))}
        </div>
      </AppShell>
    );
  }

  // ── Running ──────────────────────────────────────────────────────────────
  const lowTime = (secondsLeft ?? 0) <= WARNING_SECONDS;

  return (
    <AppShell variant="focus">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-sticky border-b border-outline-variant bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-body text-body-sm font-semibold text-on-surface">
                {test.title}
              </span>
              <span className="font-body text-[12px] text-on-surface-variant">
                {t("mock.taskProgress", { done: completedTasks })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                role="timer"
                aria-live="off"
                aria-label={t("mock.timeRemaining")}
                className={`rounded-md px-3 py-1.5 font-body text-body-md font-semibold tabular-nums ${
                  lowTime
                    ? "bg-error-container text-on-error-container"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                {formatClock(secondsLeft ?? 0)}
              </div>
              <Button onClick={() => setConfirming(true)}>{t("mock.submitTest")}</Button>
            </div>
          </div>

          <div
            className="mx-auto mt-3 flex max-w-4xl gap-2"
            role="tablist"
            aria-label={t("mock.taskNav")}
          >
            {tasks.map((task) => {
              const active = task.task_type === activeTask;
              const done = (counts[task.task_type] ?? 0) >= task.min_words;
              return (
                <button
                  key={task.task_type}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTask(task.task_type)}
                  className={`flex items-center gap-2 rounded-md border px-4 py-2 font-body text-body-sm transition-colors ${
                    active
                      ? "border-outline bg-surface-container-lowest font-semibold text-on-surface"
                      : "border-outline-variant text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {task.task_type === "TASK_1" ? t("mock.taskOne") : t("mock.taskTwo")}
                  <span
                    className={`size-2 rounded-full ${done ? "bg-tertiary" : "bg-outline"}`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">
                    {done ? t("mock.complete") : t("mock.incomplete")}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
          <section aria-label={t("mock.promptTitle")}>
            <p className="text-mono-caps uppercase text-on-surface-variant">
              {t("mock.promptTitle")}
            </p>
            <p className="mt-1.5 font-body text-body-lg text-on-surface">
              {currentTask.prompt}
            </p>

            {currentTask.stimulus && (
              <div className="mt-4 rounded-md border border-outline-variant bg-surface-container-low p-4">
                <p className="text-mono-caps uppercase text-on-surface-variant">
                  {t("mock.stimulusTitle")}
                </p>
                {currentTask.stimulus_caption && (
                  <p className="mt-1 font-body text-body-sm italic text-on-surface-variant">
                    {currentTask.stimulus_caption}
                  </p>
                )}
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-body text-body-sm text-on-surface">
                  {currentTask.stimulus}
                </pre>
              </div>
            )}
          </section>

          {/*
            No `aria-label` here: it would repeat the field's own label, so the answer
            area would be announced twice and every query for "your answer" would match
            two things.
          */}
          <section className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label
                htmlFor={`answer_${currentTask.task_type}`}
                className="block font-body text-label-caps uppercase text-on-surface-variant"
              >
                {t("mock.answerLabel")}
              </label>
              <div className="flex items-center gap-2">
                <WordCount
                  count={counts[currentTask.task_type] ?? 0}
                  minimum={currentTask.min_words}
                  label={t("grader.wordCount", {
                    count: formatNumber(counts[currentTask.task_type] ?? 0),
                    minimum: formatNumber(currentTask.min_words),
                  })}
                />
                {(counts[currentTask.task_type] ?? 0) >= currentTask.min_words && (
                  <Pill tone="positive">{t("mock.complete")}</Pill>
                )}
              </div>
            </div>
            {/*
              One textarea per task, keyed by task type: React would otherwise reuse the
              same DOM node across a task switch and carry the caret and scroll position
              of the other task's answer with it.
            */}
            <textarea
              key={currentTask.task_type}
              id={`answer_${currentTask.task_type}`}
              rows={20}
              value={answers[currentTask.task_type] ?? ""}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [currentTask.task_type]: event.target.value,
                }))
              }
              className="mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body text-body-lg leading-relaxed text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </section>
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-overlay flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("common.cancel")}
            onClick={() => setConfirming(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-title"
            className="relative w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-card"
          >
            <h2 id="submit-title" className="font-display text-headline-sm text-on-surface">
              {t("mock.submitConfirmTitle")}
            </h2>
            <p className="mt-2 font-body text-body-md text-on-surface-variant">
              {t("mock.submitConfirmBody")}
            </p>
            {incompleteTasks > 0 && (
              <p className="mt-3 rounded-md bg-error-container/50 px-3 py-2 font-body text-body-sm text-on-surface">
                {incompleteTasks === 1
                  ? t("mock.submitConfirmWarning", { count: incompleteTasks })
                  : t("mock.submitConfirmWarningPlural", { count: incompleteTasks })}
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={() => void finish()}>{t("mock.submitTest")}</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function MockTestWritingPage() {
  return (
    <ProtectedRoute>
      <MockTestRunner />
    </ProtectedRoute>
  );
}
