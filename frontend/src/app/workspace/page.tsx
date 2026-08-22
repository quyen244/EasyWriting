"use client";

/**
 * The grader.
 *
 * View states: `idle` → `submitting` → `result` | `error`.
 *
 * Two behaviours here are load-bearing and easy to break:
 *
 *  1. **Drafts are kept per task.** Switching Task 1 ↔ Task 2 must not clear what was
 *     typed for the other one. A learner toggles to check the other task's requirements
 *     constantly; losing an essay to that is unforgivable in a writing product.
 *  2. **No error path touches a draft.** Submission failures set an error and nothing
 *     else, so the essay is still in the editor by construction rather than by a restore
 *     step someone might forget.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import AppShell from "@/components/app/AppShell";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Segmented,
} from "@/components/app/Primitives";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  GraderActions,
  Task1Editor,
  Task2Editor,
  useImagePreview,
  type Task1Draft,
  type Task2Draft,
} from "@/components/grader/Editors";
import HowToPanel from "@/components/grader/HowToPanel";
import ResultDashboard from "@/components/result/ResultDashboard";
import { useLocale } from "@/hooks/useLocale";
import {
  ApiError,
  MIN_WORDS,
  countWords,
  gradeEssay,
  recommendedModuleFor,
  weakestCriterion,
  type GradeInput,
  type GradingResult,
  type TaskType,
} from "@/lib/api";

type Status = "idle" | "submitting" | "result" | "error";

const EMPTY_TASK1: Task1Draft = {
  prompt: "",
  introduction: "",
  overview: "",
  body: "",
  chartDescription: "",
  imageName: null,
};

const EMPTY_TASK2: Task2Draft = { prompt: "", essay: "" };

function Grader() {
  const router = useRouter();
  const { t, locale } = useLocale();

  const [taskType, setTaskType] = useState<TaskType>("TASK_2");
  const [task1, setTask1] = useState<Task1Draft>(EMPTY_TASK1);
  const [task2, setTask2] = useState<Task2Draft>(EMPTY_TASK2);
  const image = useImagePreview();

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const words =
    taskType === "TASK_1"
      ? countWords(task1.introduction) + countWords(task1.overview) + countWords(task1.body)
      : countWords(task2.essay);

  const canSubmit = words > 0;

  const buildInput = useCallback((): GradeInput => {
    if (taskType === "TASK_1") {
      return {
        task_type: "TASK_1",
        prompt_text: task1.prompt.trim() || null,
        introduction: task1.introduction,
        overview: task1.overview,
        body: task1.body,
        chart_description: task1.chartDescription.trim() || null,
        has_chart_image: image.file !== null,
      };
    }
    return {
      task_type: "TASK_2",
      prompt_text: task2.prompt.trim() || null,
      essay_text: task2.essay,
    };
  }, [taskType, task1, task2, image.file]);

  const submit = useCallback(async () => {
    setStatus("submitting");
    setError(null);
    try {
      const graded = await gradeEssay(buildInput(), { locale });
      setResult(graded);
      setStatus("result");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught
          : new ApiError("SCORING_FAILED", "Could not reach the scoring service."),
      );
      setStatus("error");
      // Note what is NOT here: neither draft is touched.
    }
  }, [buildInput, locale]);

  const reset = useCallback(() => {
    const hasContent = words > 20;
    if (hasContent && !window.confirm(t("grader.resetConfirm"))) return;
    if (taskType === "TASK_1") {
      setTask1(EMPTY_TASK1);
      image.clear();
    } else {
      setTask2(EMPTY_TASK2);
    }
    setResult(null);
    setError(null);
    setStatus("idle");
  }, [image, t, taskType, words]);

  const practiceHref = useMemo(() => {
    if (!result) return null;
    const weakest = weakestCriterion(result.criteria);
    if (!weakest) return null;
    const moduleId = recommendedModuleFor(result.task_type, weakest.code);
    return moduleId ? `/practice/writing/${moduleId}` : "/practice/writing";
  }, [result]);

  const showEditor = status !== "result";

  return (
    <AppShell aside={<HowToPanel taskType={taskType} />}>
      <PageHeader
        eyebrow={t("grader.eyebrow")}
        title={t("grader.title")}
        description={t("grader.description")}
      />

      <div className="flex flex-col gap-6">
        <Card className="p-4 sm:p-6">
          <p className="font-body text-label-caps uppercase text-on-surface-variant">
            {t("grader.taskType")}
          </p>
          <div className="mt-2">
            <Segmented
              name="task_type"
              label={t("grader.taskType")}
              value={taskType}
              onChange={(next) => {
                setTaskType(next);
                // Leaving the result up beside a different task's editor would invite a
                // learner to read Task 1 feedback as if it were about Task 2.
                if (status === "result" || status === "error") setStatus("idle");
              }}
              options={[
                { value: "TASK_1", label: t("grader.task1"), hint: t("grader.task1Long") },
                { value: "TASK_2", label: t("grader.task2"), hint: t("grader.task2Long") },
              ]}
            />
          </div>
        </Card>

        {showEditor && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) void submit();
            }}
            className="flex flex-col gap-6"
          >
            <Card className="p-4 sm:p-6">
              {taskType === "TASK_1" ? (
                <Task1Editor
                  draft={task1}
                  onChange={setTask1}
                  minWords={MIN_WORDS.TASK_1}
                  imagePreview={image.url}
                  onImageSelected={(file) => {
                    image.setFile(file);
                    setTask1((draft) => ({ ...draft, imageName: file.name }));
                  }}
                  onImageCleared={() => {
                    image.clear();
                    setTask1((draft) => ({ ...draft, imageName: null }));
                  }}
                />
              ) : (
                <Task2Editor
                  draft={task2}
                  onChange={setTask2}
                  minWords={MIN_WORDS.TASK_2}
                />
              )}

              <div className="mt-6">
                <GraderActions
                  onGrade={() => void submit()}
                  onReset={reset}
                  submitting={status === "submitting"}
                  canSubmit={canSubmit}
                />
              </div>
            </Card>

            {status === "idle" && (
              <EmptyState title={t("grader.emptyTitle")} message={t("grader.emptyBody")} />
            )}

            {status === "submitting" && (
              <div className="flex flex-col gap-2">
                <LoadingState message={t("grader.scoringTitle")} />
                <p className="px-1 font-body text-body-sm text-on-surface-variant">
                  {t("grader.scoringBody")}
                </p>
              </div>
            )}

            {status === "error" && error && (
              <ErrorState
                title={t("grader.errorTitle")}
                message={
                  error.code === "BELOW_MIN_WORDS"
                    ? t("grader.errorBelowMin", {
                        minimum: error.minimumWords ?? MIN_WORDS[taskType],
                      })
                    : error.code === "UNSCOREABLE"
                      ? t("grader.errorUnscoreable")
                      : t("grader.errorFailed")
                }
                action={
                  <>
                    <Button onClick={() => void submit()}>{t("common.retry")}</Button>
                    <span className="self-center font-body text-body-sm text-on-surface-variant">
                      {t("grader.essayPreserved")}
                    </span>
                  </>
                }
              />
            )}
          </form>
        )}

        {status === "result" && result && (
          <ResultDashboard
            result={result}
            actions={
              <>
                <Button onClick={() => void submit()}>{t("result.actionTryAgain")}</Button>
                <Button variant="secondary" onClick={() => setStatus("idle")}>
                  {t("result.actionImprove")}
                </Button>
                {practiceHref && (
                  <Button
                    variant="secondary"
                    onClick={() => router.push(practiceHref)}
                  >
                    {t("result.actionPractice")}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setStatus("idle")}>
                  {t("result.actionBack")}
                </Button>
              </>
            }
          />
        )}

        {status === "result" && result && (
          <p className="font-body text-body-sm text-on-surface-variant">
            <Link href="/account" className="text-primary underline underline-offset-2">
              {t("result.backToAccount")}
            </Link>
          </p>
        )}
      </div>
    </AppShell>
  );
}

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <Grader />
    </ProtectedRoute>
  );
}
