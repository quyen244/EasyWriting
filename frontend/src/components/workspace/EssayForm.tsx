"use client";

/**
 * Essay submission form (002 T027).
 *
 * Fully controlled: the parent owns `essayText`, which is what makes FR-009's
 * "essay text remains in the input after a rejection" true by construction rather than
 * by remembering to restore it in an error handler.
 */

import { MIN_WORDS, countWords, type TaskType } from "@/lib/apiClient";

interface Props {
  taskType: TaskType;
  onTaskTypeChange: (taskType: TaskType) => void;
  essayText: string;
  onEssayTextChange: (value: string) => void;
  promptText: string;
  onPromptTextChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

const TASK_LABELS: Record<TaskType, string> = {
  TASK_1: "Task 1 — report or letter",
  TASK_2: "Task 2 — essay",
};

export default function EssayForm({
  taskType,
  onTaskTypeChange,
  essayText,
  onEssayTextChange,
  promptText,
  onPromptTextChange,
  onSubmit,
  submitting,
}: Props) {
  const words = countWords(essayText);
  const minimum = MIN_WORDS[taskType];
  const belowMinimum = words < minimum;

  const labelClass = "block text-label-caps uppercase text-on-surface-variant";
  const fieldClass =
    "mt-1 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body text-body-md text-on-surface focus:border-primary";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-stack-md"
    >
      <fieldset className="border-0 p-0">
        <legend className={labelClass}>Task type</legend>
        <div className="mt-stack-sm flex flex-wrap gap-3">
          {(Object.keys(TASK_LABELS) as TaskType[]).map((value) => (
            <label
              key={value}
              className={`cursor-pointer rounded border px-4 py-2 font-body text-body-sm transition-colors ${
                taskType === value
                  ? "border-primary bg-primary/10 text-on-surface"
                  : "border-outline-variant text-on-surface-variant hover:border-outline"
              }`}
            >
              <input
                type="radio"
                name="task_type"
                value={value}
                checked={taskType === value}
                onChange={() => onTaskTypeChange(value)}
                className="sr-only"
              />
              {TASK_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="prompt_text" className={labelClass}>
          The question / prompt (optional)
        </label>
        <textarea
          id="prompt_text"
          rows={2}
          value={promptText}
          onChange={(event) => onPromptTextChange(event.target.value)}
          placeholder="Paste the exam question here so the score can judge how well you answered it."
          className={fieldClass}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="essay_text" className={labelClass}>
            Your essay
          </label>
          <span
            data-testid="word-count"
            data-below-minimum={belowMinimum}
            className={`font-body text-body-sm tabular-nums ${
              belowMinimum ? "text-error" : "text-on-surface-variant"
            }`}
          >
            {words} / {minimum} words
          </span>
        </div>
        <textarea
          id="essay_text"
          rows={16}
          value={essayText}
          onChange={(event) => onEssayTextChange(event.target.value)}
          className={`${fieldClass} font-body text-body-lg leading-relaxed`}
        />
      </div>

      <button
        type="submit"
        // Only genuinely-empty input is blocked. The word count here is a hint; `001`'s
        // server-side count is authoritative and its rejection carries the real minimum,
        // so blocking on the client would let a counting disagreement between the two
        // silently prevent a submission the server would have accepted.
        disabled={submitting || essayText.trim().length === 0}
        className="self-start rounded bg-primary px-6 py-3 font-body text-body-md font-medium text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
      >
        {submitting ? "Scoring your essay…" : "Score my essay"}
      </button>
    </form>
  );
}
