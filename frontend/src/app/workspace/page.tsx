"use client";

/**
 * Learner workspace (002 T031, US2).
 *
 * `001` ships no UI of its own (its research.md decision 2), so this is the only place
 * the scoring API is ever driven from a browser. It owns `WorkspaceViewState` from
 * data-model.md: `idle` / `submitting` / `result` / `error`.
 *
 * The single most important behaviour here is that `essayText` lives in this component
 * and is never cleared by an error path. FR-009 requires the learner's text to survive a
 * rejection, and the server deliberately does not hold a draft for us.
 */

import Link from "next/link";
import { useCallback, useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import AssessmentResult from "@/components/workspace/AssessmentResult";
import EmptyState from "@/components/workspace/EmptyState";
import EssayForm from "@/components/workspace/EssayForm";
import SubmissionError from "@/components/workspace/SubmissionError";
import ThemeToggle from "@/components/workspace/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  AssessmentApiError,
  createAssessment,
  type AssessmentResult as Result,
  type TaskType,
} from "@/lib/apiClient";

type Status = "idle" | "submitting" | "result" | "error";

function Workspace() {
  const { accessToken, account } = useAuth();

  const [taskType, setTaskType] = useState<TaskType>("TASK_2");
  const [essayText, setEssayText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<AssessmentApiError | null>(null);

  const submit = useCallback(async () => {
    if (!accessToken) return;
    setStatus("submitting");
    setError(null);

    try {
      const assessment = await createAssessment(
        {
          task_type: taskType,
          essay_text: essayText,
          prompt_text: promptText.trim() || null,
        },
        accessToken,
      );
      setResult(assessment);
      setStatus("result");
    } catch (caught) {
      setError(
        caught instanceof AssessmentApiError
          ? caught
          : new AssessmentApiError(
              "SCORING_FAILED",
              "Could not reach the scoring service.",
              0,
            ),
      );
      setStatus("error");
      // Note what is NOT here: essayText is untouched. FR-009 depends on that.
    }
  }, [accessToken, essayText, promptText, taskType]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant">
        <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-4 px-margin-mobile py-4 md:px-margin-desktop">
          <Link href="/" className="font-display text-headline-sm text-on-surface">
            WriteWise
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/profile"
              className="rounded border border-outline-variant px-3 py-2 font-body text-body-sm text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
            >
              {account?.display_name || "Profile"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-container gap-stack-lg px-margin-mobile py-stack-lg md:px-margin-desktop lg:grid-cols-2">
        <section aria-label="Essay editor">
          <h1 className="font-display text-headline-md text-on-surface">Score an essay</h1>
          <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
            One essay at a time. Past submissions are not listed here yet.
          </p>
          <div className="mt-stack-md">
            <EssayForm
              taskType={taskType}
              onTaskTypeChange={setTaskType}
              essayText={essayText}
              onEssayTextChange={setEssayText}
              promptText={promptText}
              onPromptTextChange={setPromptText}
              onSubmit={submit}
              submitting={status === "submitting"}
            />
          </div>
        </section>

        <section aria-label="Result" className="lg:sticky lg:top-stack-md lg:self-start">
          {status === "idle" && <EmptyState />}

          {status === "submitting" && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg border border-outline-variant bg-surface-container-low p-6"
            >
              <p className="flex items-center gap-3 font-body text-body-md text-on-surface">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
                />
                Scoring against all four criteria…
              </p>
              <p className="mt-stack-sm font-body text-body-sm text-on-surface-variant">
                This usually takes a few seconds and never more than a minute.
              </p>
            </div>
          )}

          {status === "result" && result && <AssessmentResult result={result} />}

          {status === "error" && error && (
            <SubmissionError error={error} onRetry={submit} />
          )}
        </section>
      </main>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <Workspace />
    </ProtectedRoute>
  );
}
