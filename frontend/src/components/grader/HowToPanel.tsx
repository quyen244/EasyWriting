"use client";

/**
 * The grader's contextual panel: how to use it, what it scores on, and where to go next.
 *
 * The criteria list is task-aware. Showing Task Response beside a Task 1 editor would
 * teach the learner the wrong rubric before they have written a word, which is a worse
 * error than showing nothing.
 */

import Link from "next/link";

import { Panel } from "@/components/app/Primitives";
import { useLocale } from "@/hooks/useLocale";
import { CRITERIA_BY_TASK, criterionLabel, type TaskType } from "@/lib/api";

export default function HowToPanel({ taskType }: { taskType: TaskType }) {
  const { t, locale } = useLocale();

  const steps = [t("howTo.step1"), t("howTo.step2"), t("howTo.step3")];

  return (
    <div className="flex flex-col gap-4">
      <Panel title={t("howTo.title")}>
        <ol className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-container font-body text-[12px] font-bold text-on-surface"
              >
                {index + 1}
              </span>
              <span className="font-body text-body-sm text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title={t("howTo.criteriaTitle")}>
        <p className="font-body text-body-sm text-on-surface-variant">
          {t("howTo.criteriaBody")}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {CRITERIA_BY_TASK[taskType].map((code) => (
            <li
              key={code}
              className="flex items-center gap-2 font-body text-body-sm text-on-surface"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              {criterionLabel(code, locale)}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-outline-variant pt-3 font-body text-body-sm text-on-surface-variant">
          {taskType === "TASK_1"
            ? t("howTo.taskCriteriaTask1")
            : t("howTo.taskCriteriaTask2")}
        </p>
      </Panel>

      <Panel title={t("howTo.fullTestTitle")} tone="accent">
        <p className="font-body text-body-sm text-on-primary-fixed">
          {t("howTo.fullTestBody")}
        </p>
        <Link
          href="/mock-test/writing"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary-container px-4 py-2 font-body text-body-sm font-semibold text-on-primary-container transition-colors hover:bg-primary"
        >
          {t("howTo.fullTestCta")}
          <span aria-hidden="true">→</span>
        </Link>
      </Panel>
    </div>
  );
}
