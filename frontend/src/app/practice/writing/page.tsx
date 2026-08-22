"use client";

/**
 * Practice → Writing: the module list.
 *
 * Built as a course rather than a card wall. The modules for a task are ordered from the
 * shape of the task (paraphrase → overview → body) through the sentence-level drills, so
 * reading top to bottom is itself a curriculum; and the learner's weakest criterion is
 * surfaced above the list, because the whole point of grading is knowing where to start.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import AppShell from "@/components/app/AppShell";
import {
  Card,
  LoadingState,
  PageHeader,
  Panel,
  Pill,
  Segmented,
} from "@/components/app/Primitives";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLocale } from "@/hooks/useLocale";
import {
  criterionLabel,
  getProgress,
  listModules,
  recommendedModuleFor,
  type Difficulty,
  type PracticeModuleSummary,
  type TaskType,
} from "@/lib/api";
import type { MessageKey } from "@/lib/i18n";

const DIFFICULTY_LABEL: Record<Difficulty, MessageKey> = {
  foundation: "practice.difficultyFoundation",
  intermediate: "practice.difficultyIntermediate",
  advanced: "practice.difficultyAdvanced",
};

function PracticeWriting() {
  const { t, locale } = useLocale();
  const [taskType, setTaskType] = useState<TaskType>("TASK_2");
  const [modules, setModules] = useState<PracticeModuleSummary[] | null>(null);
  const [recommended, setRecommended] = useState<{ id: string; criterion: string } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    setModules(null);
    void listModules(taskType, locale).then((loaded) => {
      if (active) setModules(loaded);
    });
    return () => {
      active = false;
    };
  }, [taskType, locale]);

  // The recommendation comes from the learner's actual history, so it changes as they
  // improve rather than being pinned to whatever was weakest the first time.
  useEffect(() => {
    let active = true;
    void getProgress().then((progress) => {
      if (!active || !progress.weakest) return;
      const moduleId = recommendedModuleFor(taskType, progress.weakest.code);
      setRecommended(
        moduleId
          ? { id: moduleId, criterion: criterionLabel(progress.weakest.code, locale) }
          : null,
      );
    });
    return () => {
      active = false;
    };
  }, [taskType, locale]);

  return (
    <AppShell
      aside={
        recommended && modules ? (
          <Panel title={t("practice.recommendedForYou")} tone="accent">
            <p className="font-body text-body-sm text-on-primary-fixed">
              {t("practice.recommendedBecause", { criterion: recommended.criterion })}
            </p>
            <Link
              href={`/practice/writing/${recommended.id}`}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary-container px-4 py-2 font-body text-body-sm font-semibold text-on-primary-container transition-colors hover:bg-primary"
            >
              {modules.find((module) => module.id === recommended.id)?.title ??
                t("practice.start")}
              <span aria-hidden="true">→</span>
            </Link>
          </Panel>
        ) : undefined
      }
    >
      <PageHeader
        eyebrow={t("practice.eyebrow")}
        title={t("practice.writingTitle")}
        description={t("practice.writingDescription")}
      />

      <Segmented
        name="practice_task"
        label={t("grader.taskType")}
        value={taskType}
        onChange={setTaskType}
        options={[
          { value: "TASK_1", label: t("grader.task1") },
          { value: "TASK_2", label: t("grader.task2") },
        ]}
      />

      <h2 className="mt-6 font-display text-headline-sm text-on-surface">
        {t("practice.modulesFor", {
          task: taskType === "TASK_1" ? t("grader.task1") : t("grader.task2"),
        })}
      </h2>

      {!modules ? (
        <div className="mt-4">
          <LoadingState message={t("common.loading")} />
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={index}
              recommended={recommended?.id === module.id}
            />
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function ModuleCard({
  module,
  index,
  recommended,
}: {
  module: PracticeModuleSummary;
  index: number;
  recommended: boolean;
}) {
  const { t, locale } = useLocale();
  const done = module.completed_count;
  const total = module.exercise_count;
  const complete = done >= total;
  const started = done > 0;

  return (
    <Card
      as="li"
      className={`flex flex-col p-5 transition-colors hover:border-outline ${
        recommended ? "border-primary/50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-container font-display text-body-md font-bold text-on-surface-variant"
        >
          {index + 1}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {recommended && <Pill tone="warning">{t("practice.recommendedForYou")}</Pill>}
          <Pill>{t(DIFFICULTY_LABEL[module.difficulty])}</Pill>
        </div>
      </div>

      <h3 className="mt-3 font-display text-headline-sm text-on-surface">
        {module.title}
      </h3>
      <p className="mt-1.5 flex-1 font-body text-body-sm text-on-surface-variant">
        {module.description}
      </p>

      <p className="mt-4 flex flex-wrap items-center gap-1.5 font-body text-[12px] text-on-surface-variant">
        <span className="uppercase tracking-wide">{t("practice.trains")}:</span>
        {module.trains.map((code) => (
          <span
            key={code}
            className="rounded bg-surface-container px-2 py-0.5 text-on-surface"
          >
            {criterionLabel(code, locale)}
          </span>
        ))}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-body text-[12px] text-on-surface-variant">
            {started ? t("practice.progress", { done, total }) : t("practice.notStarted")}
          </span>
          {complete && <span className="font-body text-[12px] text-tertiary">✓</span>}
        </div>
        <span
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={module.title}
          className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high"
        >
          <span
            aria-hidden="true"
            className={`block h-full rounded-full ${complete ? "bg-tertiary" : "bg-primary"}`}
            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
          />
        </span>
      </div>

      <Link
        href={`/practice/writing/${module.id}`}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary-container px-4 py-2.5 font-body text-body-sm font-semibold text-on-primary-container transition-colors hover:bg-primary"
      >
        {complete ? t("practice.review") : started ? t("practice.continue") : t("practice.start")}
        <span aria-hidden="true">→</span>
      </Link>
    </Card>
  );
}

export default function PracticeWritingPage() {
  return (
    <ProtectedRoute>
      <PracticeWriting />
    </ProtectedRoute>
  );
}
