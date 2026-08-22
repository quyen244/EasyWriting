/**
 * Generates supabase/seed.sql from the TypeScript fixtures the frontend already ships.
 *
 * Transcribing 12 modules and 36 exercises by hand would guarantee a divergence between
 * what the app shows in mock mode and what the database holds. Reading the fixtures is
 * the only way the two stay the same text.
 */

import { writeFileSync } from "node:fs";

import { MOCK_TESTS } from "../frontend/src/mockData/mockTests";
import { PRACTICE_MODULES } from "../frontend/src/mockData/practice";

const lit = (v: string | null | undefined) =>
  v === null || v === undefined ? "null" : `'${v.replace(/'/g, "''")}'`;

const json = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;

/** D-14: the database uses the official criterion name. */
const CODE: Record<string, string> = {
  GRAMMATICAL_RANGE: "GRAMMATICAL_RANGE_ACCURACY",
};
const code = (c: string) => CODE[c] ?? c;

const TEST_TITLE_VI: Record<string, string> = {
  mock_writing_01: "Viết học thuật — Đề 1",
  mock_writing_02: "Viết học thuật — Đề 2",
};

const out: string[] = [];

out.push(`-- Generated from frontend/src/mockData by scripts/gen-seed.ts. Do not edit by hand:
-- regenerate it so the seeded content and the app's mock mode never drift apart.
--
-- Idempotent — every insert upserts, so re-running against a populated database is safe.

begin;
`);

// ── Mock tests ────────────────────────────────────────────────────────────────

out.push(`\n-- ${MOCK_TESTS.length} full Writing tests\n`);
MOCK_TESTS.forEach((test, i) => {
  out.push(
    `insert into public.mock_tests (id, title, duration_minutes, position) values (` +
      `${lit(test.id)}, ${json({ en: test.title, vi: TEST_TITLE_VI[test.id] ?? test.title })}, ` +
      `${test.duration_minutes}, ${i})\n` +
      `on conflict (id) do update set title = excluded.title, ` +
      `duration_minutes = excluded.duration_minutes, position = excluded.position;`,
  );
  test.tasks.forEach((task, p) => {
    out.push(
      `insert into public.mock_test_tasks ` +
        `(test_id, task_type, prompt, stimulus, stimulus_caption, min_words, suggested_minutes, position)\n` +
        `values (${lit(test.id)}, ${lit(task.task_type)}, ${lit(task.prompt)}, ` +
        `${lit(task.stimulus ?? null)}, ${lit(task.stimulus_caption ?? null)}, ` +
        `${task.min_words}, ${task.suggested_minutes}, ${p})\n` +
        `on conflict (test_id, task_type) do update set prompt = excluded.prompt, ` +
        `stimulus = excluded.stimulus, stimulus_caption = excluded.stimulus_caption, ` +
        `min_words = excluded.min_words, suggested_minutes = excluded.suggested_minutes, ` +
        `position = excluded.position;`,
    );
  });
});

// ── Practice ──────────────────────────────────────────────────────────────────

const exerciseCount = PRACTICE_MODULES.reduce((n, m) => n + m.exercises.length, 0);
out.push(`\n-- ${PRACTICE_MODULES.length} practice modules, ${exerciseCount} exercises\n`);

PRACTICE_MODULES.forEach((practiceModule, i) => {
  const trains = practiceModule.trains.map(code);
  out.push(
    `insert into public.practice_modules ` +
      `(id, task_type, title, description, intro, difficulty, trains, position)\n` +
      `values (${lit(practiceModule.id)}, ${lit(practiceModule.task_type)}, ` +
      `${json(practiceModule.title)}, ${json(practiceModule.description)}, ` +
      `${json(practiceModule.intro)}, ${lit(practiceModule.difficulty)}, ` +
      `array[${trains.map((t) => lit(t)).join(", ")}]::text[], ${i})\n` +
      `on conflict (id) do update set task_type = excluded.task_type, ` +
      `title = excluded.title, description = excluded.description, intro = excluded.intro, ` +
      `difficulty = excluded.difficulty, trains = excluded.trains, position = excluded.position;`,
  );
  practiceModule.exercises.forEach((ex, p) => {
    out.push(
      `insert into public.practice_exercises ` +
        `(id, module_id, position, prompt, source, hints, model_answer, feedback)\n` +
        `values (${lit(ex.id)}, ${lit(practiceModule.id)}, ${p}, ${json(ex.prompt)}, ` +
        `${lit(ex.source ?? null)}, ${json(ex.hints)}, ${lit(ex.model_answer)}, ` +
        `${json(ex.feedback)})\n` +
        `on conflict (id) do update set module_id = excluded.module_id, ` +
        `position = excluded.position, prompt = excluded.prompt, source = excluded.source, ` +
        `hints = excluded.hints, model_answer = excluded.model_answer, ` +
        `feedback = excluded.feedback;`,
    );
  });
});

out.push(`\ncommit;\n`);

writeFileSync(
  new URL("../supabase/seed.sql", import.meta.url),
  out.join("\n"),
  "utf8",
);

console.log(
  `seed.sql: ${MOCK_TESTS.length} tests, ${PRACTICE_MODULES.length} modules, ${exerciseCount} exercises`,
);
