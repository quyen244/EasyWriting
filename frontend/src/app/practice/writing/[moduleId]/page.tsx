"use client";

/**
 * A practice module, run one exercise at a time.
 *
 * Flow per exercise: read the prompt and the source → write → check → compare against the
 * model answer → next. The model answer is shown only *after* an attempt: shown before,
 * it is a passage to copy rather than a standard to measure against.
 *
 * Progress is recorded as a count, so leaving halfway keeps what was done and re-running
 * a finished module never walks the learner backwards.
 */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AppShell from "@/components/app/AppShell";
import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  Pill,
} from "@/components/app/Primitives";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/hooks/useLocale";
import {
  checkAnswer,
  criterionLabel,
  getModule,
  recordProgress,
  type PracticeFeedback,
  type PracticeModuleDetail,
} from "@/lib/api";

function ModuleRunner() {
  const params = useParams<{ moduleId: string }>();
  const router = useRouter();
  const { t, locale } = useLocale();

  const [module, setModule] = useState<PracticeModuleDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let active = true;
    void getModule(params.moduleId, locale)
      .then((loaded) => {
        if (!active) return;
        setModule(loaded);
        // Resume where the learner left off, unless they had already finished.
        setIndex(loaded.completed_count >= loaded.exercises.length ? 0 : loaded.completed_count);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [params.moduleId, locale]);

  const exercise = module?.exercises[index] ?? null;

  const check = useCallback(async () => {
    if (!module || !exercise) return;
    if (answer.trim().length === 0) {
      setAnswerError(t("practice.emptyAnswer"));
      return;
    }
    setAnswerError(null);
    setChecking(true);
    try {
      setFeedback(
        await checkAnswer(
          { module_id: module.id, exercise_id: exercise.id, answer },
          locale,
        ),
      );
      await recordProgress(module.id, index + 1);
    } finally {
      setChecking(false);
    }
  }, [answer, exercise, index, locale, module, t]);

  function advance() {
    if (!module) return;
    setFeedback(null);
    setAnswer("");
    setAnswerError(null);
    if (index + 1 >= module.exercises.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  }

  function restart() {
    setFinished(false);
    setIndex(0);
    setAnswer("");
    setFeedback(null);
  }

  if (loadError) {
    return (
      <AppShell>
        <ErrorState
          title={t("common.somethingWentWrong")}
          message={t("common.tryAgainLater")}
          action={
            <Button onClick={() => router.push("/practice/writing")}>
              {t("practice.backToModules")}
            </Button>
          }
        />
      </AppShell>
    );
  }

  if (!module) {
    return (
      <AppShell>
        <LoadingState message={t("common.loading")} />
      </AppShell>
    );
  }

  return (
    <AppShell
      aside={
        <div className="flex flex-col gap-4">
          <Panel title={t("practice.hintsTitle")}>
            <ul className="flex flex-col gap-2">
              {(exercise?.hints ?? []).map((hint) => (
                <li key={hint} className="flex gap-2 font-body text-body-sm text-on-surface">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {hint}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={t("practice.trains")}>
            <ul className="flex flex-wrap gap-1.5">
              {module.trains.map((code) => (
                <li
                  key={code}
                  className="rounded bg-surface-container px-2 py-1 font-body text-[12px] text-on-surface"
                >
                  {criterionLabel(code, locale)}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      }
    >
      <PageHeader
        eyebrow={t("practice.eyebrow")}
        title={module.title}
        description={module.intro}
        actions={
          <Link
            href="/practice/writing"
            className="inline-flex items-center gap-2 rounded-md border border-outline-variant px-4 py-2 font-body text-body-sm font-semibold text-on-surface transition-colors hover:border-outline"
          >
            {t("practice.backToModules")}
          </Link>
        }
      />

      {finished ? (
        <Card className="p-8 text-center">
          <p className="text-mono-caps uppercase text-tertiary">
            {t("practice.moduleComplete")}
          </p>
          <h2 className="mt-2 font-display text-headline-md text-on-surface">
            {module.title}
          </h2>
          <p className="mx-auto mt-2 max-w-prose font-body text-body-md text-on-surface-variant">
            {t("practice.moduleCompleteBody")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={restart}>{t("practice.restartModule")}</Button>
            <Button variant="secondary" onClick={() => router.push("/practice/writing")}>
              {t("practice.backToModules")}
            </Button>
          </div>
        </Card>
      ) : (
        exercise && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-body text-body-sm text-on-surface-variant">
                {t("practice.exerciseOf", {
                  current: index + 1,
                  total: module.exercises.length,
                })}
              </p>
              <div className="flex gap-1" aria-hidden="true">
                {module.exercises.map((item, position) => (
                  <span
                    key={item.id}
                    className={`h-1.5 w-8 rounded-full ${
                      position < index
                        ? "bg-tertiary"
                        : position === index
                          ? "bg-primary"
                          : "bg-surface-container-high"
                    }`}
                  />
                ))}
              </div>
            </div>

            <Card className="p-5 sm:p-6">
              <p className="text-mono-caps uppercase text-on-surface-variant">
                {t("practice.prompt")}
              </p>
              <p className="mt-1.5 font-body text-body-lg text-on-surface">
                {exercise.prompt}
              </p>

              {exercise.source && (
                <div className="mt-4 rounded-md border-s-2 border-primary/60 bg-surface-container-low p-4">
                  <p className="text-mono-caps uppercase text-on-surface-variant">
                    {t("practice.sourceText")}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line font-body text-body-md italic text-on-surface">
                    {exercise.source}
                  </p>
                </div>
              )}

              <div className="mt-5">
                <label
                  htmlFor="practice_answer"
                  className="block font-body text-label-caps uppercase text-on-surface-variant"
                >
                  {t("practice.yourAnswer")}
                </label>
                <textarea
                  id="practice_answer"
                  rows={6}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder={t("practice.answerPlaceholder")}
                  aria-invalid={answerError ? true : undefined}
                  className={`mt-1.5 w-full rounded-md border bg-surface-container-lowest px-3.5 py-3 font-body text-body-md leading-relaxed text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 ${
                    answerError ? "border-error" : "border-outline-variant"
                  }`}
                />
                {answerError && (
                  <p className="mt-1.5 font-body text-body-sm text-error">{answerError}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!feedback ? (
                  <Button onClick={() => void check()} disabled={checking}>
                    {checking ? t("practice.checking") : t("practice.checkAnswer")}
                  </Button>
                ) : (
                  <Button onClick={advance}>
                    {index + 1 >= module.exercises.length
                      ? t("practice.finishModule")
                      : t("practice.nextExercise")}
                  </Button>
                )}
              </div>
            </Card>

            {feedback && (
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-headline-sm text-on-surface">
                    {t("practice.feedback")}
                  </h2>
                  <Pill tone="info">{t("practice.compareHint")}</Pill>
                </div>

                <ul className="mt-4 flex flex-col gap-2">
                  {feedback.notes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-secondary"
                      />
                      <span className="font-body text-body-sm text-on-surface">{note}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-md bg-surface-container-low p-4">
                  <p className="text-mono-caps uppercase text-on-surface-variant">
                    {t("practice.modelAnswer")}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line font-body text-body-md text-on-surface">
                    {feedback.model_answer}
                  </p>
                </div>

                <p className="mt-4 font-body text-body-sm text-on-surface-variant">
                  {feedback.feedback}
                </p>
              </Card>
            )}
          </div>
        )
      )}
    </AppShell>
  );
}

export default function PracticeModulePage() {
  return (
    <ProtectedRoute>
      <ModuleRunner />
    </ProtectedRoute>
  );
}
