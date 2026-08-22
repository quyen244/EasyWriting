"use client";

/**
 * The two grader editors.
 *
 * They are genuinely different forms, not one form with a different word minimum. Task 2
 * is a prompt and an essay. Task 1 is a prompt, a stimulus the learner has to supply
 * somehow, and three separately-scored parts — introduction, overview, body — which the
 * editor shows as three labelled areas because that structure is what examiners mark.
 *
 * Both are fully controlled by the page. That is what makes "your essay survives a failed
 * submission" true by construction rather than by remembering to restore it in an error
 * handler: the text lives above this component and no error path here can reach it.
 */

import { useEffect, useRef, useState } from "react";

import { Button, WordCount } from "@/components/app/Primitives";
import { useLocale } from "@/hooks/useLocale";
import { countWords } from "@/lib/api";
import type { MessageKey } from "@/lib/i18n";

const FIELD =
  "mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-3 font-body text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/70 hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";
const LABEL = "block font-body text-label-caps uppercase text-on-surface-variant";

// ── Shared pieces ─────────────────────────────────────────────────────────────

function PromptField({
  value,
  onChange,
  labelKey,
}: {
  value: string;
  onChange: (value: string) => void;
  labelKey: MessageKey;
}) {
  const { t } = useLocale();
  return (
    <div>
      <label htmlFor="prompt_text" className={LABEL}>
        {t(labelKey)}
      </label>
      <textarea
        id="prompt_text"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("grader.promptPlaceholder")}
        className={FIELD}
      />
    </div>
  );
}

export function GraderActions({
  onGrade,
  onReset,
  submitting,
  canSubmit,
}: {
  onGrade: () => void;
  onReset: () => void;
  submitting: boolean;
  canSubmit: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap gap-3">
      <Button type="submit" onClick={onGrade} disabled={submitting || !canSubmit}>
        <span aria-hidden="true">🚀</span>
        {submitting ? t("grader.grading") : t("grader.gradeNow")}
      </Button>
      <Button type="button" variant="secondary" onClick={onReset} disabled={submitting}>
        <span aria-hidden="true">⟳</span>
        {t("grader.reset")}
      </Button>
    </div>
  );
}

// ── Task 2 ────────────────────────────────────────────────────────────────────

export interface Task2Draft {
  prompt: string;
  essay: string;
}

export function Task2Editor({
  draft,
  onChange,
  minWords,
}: {
  draft: Task2Draft;
  onChange: (draft: Task2Draft) => void;
  minWords: number;
}) {
  const { t, formatNumber } = useLocale();
  const words = countWords(draft.essay);

  return (
    <div className="flex flex-col gap-5">
      <PromptField
        value={draft.prompt}
        onChange={(prompt) => onChange({ ...draft, prompt })}
        labelKey="grader.promptOptional"
      />

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="essay_text" className={LABEL}>
            {t("grader.essay")}
          </label>
          <WordCount
            count={words}
            minimum={minWords}
            label={t("grader.wordCount", {
              count: formatNumber(words),
              minimum: formatNumber(minWords),
            })}
          />
        </div>
        <textarea
          id="essay_text"
          rows={16}
          value={draft.essay}
          onChange={(event) => onChange({ ...draft, essay: event.target.value })}
          placeholder={t("grader.essayPlaceholder")}
          className={`${FIELD} text-body-lg leading-relaxed`}
        />
      </div>
    </div>
  );
}

// ── Task 1 ────────────────────────────────────────────────────────────────────

export interface Task1Draft {
  prompt: string;
  introduction: string;
  overview: string;
  body: string;
  chartDescription: string;
  imageName: string | null;
}

const TASK1_PARTS = [
  { key: "introduction", labelKey: "grader.introduction", helpKey: "grader.introductionHelp", rows: 3 },
  { key: "overview", labelKey: "grader.overview", helpKey: "grader.overviewHelp", rows: 3 },
  { key: "body", labelKey: "grader.body", helpKey: "grader.bodyHelp", rows: 10 },
] as const;

export function Task1Editor({
  draft,
  onChange,
  minWords,
  imagePreview,
  onImageSelected,
  onImageCleared,
}: {
  draft: Task1Draft;
  onChange: (draft: Task1Draft) => void;
  minWords: number;
  /** An object URL owned by the page — this component never creates or revokes one. */
  imagePreview: string | null;
  onImageSelected: (file: File) => void;
  onImageCleared: () => void;
}) {
  const { t, formatNumber } = useLocale();
  const fileInput = useRef<HTMLInputElement>(null);

  const partCounts = {
    introduction: countWords(draft.introduction),
    overview: countWords(draft.overview),
    body: countWords(draft.body),
  };
  const total = partCounts.introduction + partCounts.overview + partCounts.body;

  return (
    <div className="flex flex-col gap-5">
      <PromptField
        value={draft.prompt}
        onChange={(prompt) => onChange({ ...draft, prompt })}
        labelKey="grader.prompt"
      />

      {/* Stimulus: image or description. Either satisfies it; neither blocks grading. */}
      <fieldset className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
        <legend className={`${LABEL} px-1`}>{t("grader.chartTitle")}</legend>
        <p className="font-body text-body-sm text-on-surface-variant">
          {t("grader.chartHelp")}
        </p>

        <div className="mt-3 flex flex-wrap items-start gap-4">
          <input
            ref={fileInput}
            id="chart_image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImageSelected(file);
              // Clearing the input's value lets the learner pick the same file again
              // after removing it — otherwise the change event never fires.
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInput.current?.click()}
          >
            {imagePreview ? t("grader.chartReplace") : t("grader.chartUpload")}
          </Button>

          {imagePreview && (
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a blob: object URL
                  from the learner's own file picker; next/image cannot optimise it and
                  its dimensions are unknown until load. */}
              <img
                src={imagePreview}
                alt={draft.imageName ?? t("grader.chartPreviewAlt")}
                className="max-h-40 rounded-md border border-outline-variant object-contain"
              />
              <Button type="button" variant="ghost" onClick={onImageCleared}>
                {t("grader.chartRemove")}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="chart_description" className={LABEL}>
            {t("grader.chartDescription")}
          </label>
          <textarea
            id="chart_description"
            rows={3}
            value={draft.chartDescription}
            onChange={(event) =>
              onChange({ ...draft, chartDescription: event.target.value })
            }
            placeholder={t("grader.chartDescriptionPlaceholder")}
            className={FIELD}
          />
        </div>
      </fieldset>

      {/* The three-part structure, shown as three parts. */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className={LABEL}>{t("grader.structureLabel")}</p>
          <WordCount
            count={total}
            minimum={minWords}
            label={t("grader.wordCount", {
              count: formatNumber(total),
              minimum: formatNumber(minWords),
            })}
          />
        </div>

        <ol className="mt-2 flex flex-col gap-3">
          {TASK1_PARTS.map((part, index) => (
            <li
              key={part.key}
              className="rounded-md border border-outline-variant bg-surface-container-lowest p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label
                  htmlFor={part.key}
                  className="flex items-center gap-2 font-body text-body-md font-semibold text-on-surface"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-6 items-center justify-center rounded-full bg-primary-fixed font-body text-[12px] font-bold text-on-primary-fixed"
                  >
                    {index + 1}
                  </span>
                  {t(part.labelKey)}
                </label>
                <span className="font-body text-[12px] tabular-nums text-on-surface-variant">
                  {t("grader.wordCountShort", {
                    count: formatNumber(partCounts[part.key]),
                  })}
                </span>
              </div>
              <p className="mt-1 font-body text-body-sm text-on-surface-variant">
                {t(part.helpKey)}
              </p>
              <textarea
                id={part.key}
                rows={part.rows}
                value={draft[part.key]}
                onChange={(event) => onChange({ ...draft, [part.key]: event.target.value })}
                className={`${FIELD} leading-relaxed`}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/**
 * Holds an object URL for a picked image and revokes it on replace or unmount.
 *
 * Without the revoke every replaced image leaks for the lifetime of the tab — invisible
 * in a demo, real on a machine where someone tries six charts.
 */
export function useImagePreview() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return { file, url, setFile, clear: () => setFile(null) };
}
