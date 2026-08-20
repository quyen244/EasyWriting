/**
 * Error panel for a rejected or failed submission (002 T031, FR-009).
 *
 * Copy is chosen per `001` error code rather than showing the server's message verbatim,
 * because the three failures need three different learner actions:
 *
 *   BELOW_MIN_WORDS — fixable now; the server tells us the exact minimum, so show it
 *   UNSCOREABLE     — fixable now, but by rewriting rather than lengthening
 *   SCORING_FAILED  — not the learner's fault and not fixable by editing; offer retry
 *
 * Collapsing them into one "something went wrong" would leave a learner editing an essay
 * that was never the problem.
 */

import type { AssessmentApiError } from "@/lib/apiClient";

export default function SubmissionError({
  error,
  onRetry,
}: {
  error: AssessmentApiError;
  onRetry: () => void;
}) {
  const heading =
    error.error === "BELOW_MIN_WORDS"
      ? "Your essay is too short to score"
      : error.error === "UNSCOREABLE"
        ? "This does not look like an essay yet"
        : error.error === "SESSION_EXPIRED"
          ? "Your session expired"
          : "Scoring could not finish";

  const body =
    error.error === "BELOW_MIN_WORDS"
      ? `IELTS requires at least ${error.minimumWords ?? "the stated minimum"} words for this task. Your essay is still in the editor — keep writing and submit again.`
      : error.error === "UNSCOREABLE"
        ? "There is not enough connected writing here to assess against the criteria. Your text is still in the editor."
        : error.error === "SESSION_EXPIRED"
          ? "Sign in again to submit. Your essay is still in the editor — copy it somewhere safe first if you want to be certain."
          : "This is a problem on our side, not with your essay. Nothing you typed was lost.";

  return (
    <div
      role="alert"
      className="rounded-lg border border-error bg-error/10 p-6"
    >
      <h2 className="font-display text-headline-sm text-on-surface">{heading}</h2>
      <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">{body}</p>

      {error.isRetryable && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-stack-md rounded bg-primary px-4 py-2.5 font-body text-body-md font-medium text-on-primary transition-colors hover:bg-primary-container"
        >
          Try again
        </button>
      )}
    </div>
  );
}
