// The grader against a real local Supabase stack.
//
// This exercises the actual path a learner takes — `lib/api/grading.ts` inserts a
// `writing_attempts` row, a database trigger dispatches the `grade-attempt` Edge
// Function, and the row comes back marked — rather than a hand-written imitation of it.
// The unit suite covers the mock transport; nothing there would notice if the RLS
// grants, the trigger, or the criteria shape were wrong, because none of it is reached.
//
// Skipped unless RUN_LOCAL_SUPABASE=1, because it needs a stack that is running:
//
//   supabase start
//   supabase db reset
//   ./supabase/scripts/setup-local-grading.sh
//   supabase functions serve --env-file supabase/functions/.env
//   cd frontend && RUN_LOCAL_SUPABASE=1 npx vitest run tests/integration
//
// Runs in the shared jsdom environment like the rest of the suite: jsdom provides the
// WebSocket the realtime subscription needs, and tests/setup.ts assumes a `window`.

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ENABLED = process.env.RUN_LOCAL_SUPABASE === "1";

// Set before importing anything, because `isSupabaseConfigured` is read at module load.
// The local publishable key is fixed by the CLI and is not a secret.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??=
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

const TEST_EMAIL = process.env.TEST_EMAIL ?? "learner@local.test";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "local-test-password-123";

const ESSAY = `Social media has changed the way people communicate with each other. Some argue that these platforms bring people closer together, while others believe they cause isolation. In my opinion, the benefits outweigh the drawbacks.

Firstly, social media allows families separated by distance to stay in contact. A grandparent in a rural village can watch their grandchildren grow up through photographs and video calls, which was impossible a generation ago. Moreover, online communities give people with rare interests somewhere to belong, and this matters a great deal for those who feel isolated in their own neighbourhood.

However, there are genuine costs. Many young people compare their ordinary lives to the edited highlights of others, and this comparison damages confidence over time. In addition, time spent scrolling is time not spent on study, exercise or face to face conversation, and the habit is difficult to break once it forms.

In conclusion, although social media carries real risks, its capacity to connect people across distance makes it more useful than harmful, provided it is used with some discipline.`;

describe.skipIf(!ENABLED)("grading against local Supabase", () => {
  // Imported dynamically so the env vars above are in place first.
  let api: typeof import("@/lib/api/grading");
  let types: typeof import("@/lib/api/types");
  let client: import("@supabase/supabase-js").SupabaseClient;
  const createdAttempts: string[] = [];

  beforeAll(async () => {
    const { getSupabaseBrowserClient, isSupabaseConfigured } = await import(
      "@/lib/supabase/client"
    );
    expect(isSupabaseConfigured, "env vars did not reach the client module").toBe(true);

    client = getSupabaseBrowserClient();
    const { error } = await client.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error) {
      throw new Error(
        `Could not sign in as ${TEST_EMAIL}: ${error.message}. ` +
          "Run ./supabase/scripts/setup-local-grading.sh first.",
      );
    }

    api = await import("@/lib/api/grading");
    types = await import("@/lib/api/types");
  }, 60_000);

  // Every row this file creates is removed again. Not tidiness: supabase/tests/api.mjs
  // asserts on counts ("the learner has one scored essay", "words are counted from the
  // submission") and assumes it is the only writer. A scored attempt left behind here
  // fails four of its assertions in a way that reads like a regression and is not one.
  //
  // The rate-limit ledger is deliberately NOT cleaned: it is append-only by design and
  // a learner cannot reach it, which is the property `0011` exists to guarantee.
  afterAll(async () => {
    for (const id of createdAttempts) {
      await client.from("writing_attempts").delete().eq("id", id);
    }
  }, 30_000);

  it(
    "rejects unscoreable text at the server gate, without spending a model call",
    async () => {
      // Deliberately long enough to clear the browser-side floor, so this really does
      // reach the Edge Function's gate rather than being caught before submission.
      const notEnglish = Array(40).fill("这是一篇关于社交媒体的文章").join(" ");

      await expect(
        api.gradeEssay(
          { task_type: "TASK_2", essay_text: notEnglish, prompt_text: null },
          { locale: "en" },
        ),
      ).rejects.toMatchObject({ code: "UNSCOREABLE" });

      // gradeEssay throws on a rejected attempt, so the row's id never reaches the
      // caller — it is looked up here purely so afterAll can remove it.
      const { data } = await client
        .from("writing_attempts")
        .select("id")
        .eq("essay_text", notEnglish);
      for (const row of data ?? []) createdAttempts.push(row.id as string);
    },
    120_000,
  );

  it(
    "marks a real essay, or fails with a documented error — never anything else",
    async () => {
      let result: Awaited<ReturnType<typeof api.gradeEssay>> | null = null;
      let failure: InstanceType<typeof types.ApiError> | null = null;

      try {
        result = await api.gradeEssay(
          {
            task_type: "TASK_2",
            prompt_text:
              "Some people think social media brings people together, while others " +
              "believe it isolates them. Discuss both views and give your opinion.",
            essay_text: ESSAY,
          },
          { locale: "vi" },
        );
      } catch (err) {
        // The contract every caller is written against: this either resolves with a
        // result or throws an ApiError. An unhandled provider error reaching the UI
        // would be the actual bug, so it is asserted rather than tolerated.
        expect(err).toBeInstanceOf(types.ApiError);
        failure = err as InstanceType<typeof types.ApiError>;
      }

      if (!result) {
        const { data } = await client
          .from("writing_attempts")
          .select("id")
          .eq("essay_text", ESSAY);
        for (const row of data ?? []) createdAttempts.push(row.id as string);

        // Reached when the model provider is unavailable — a free-tier daily quota, for
        // instance. The pipeline still ran: the row was inserted, dispatched, claimed,
        // attempted and marked failed, which is most of what this test exists to prove.
        expect(failure!.code).toBe("SCORING_FAILED");
        console.warn(
          `Scoring did not complete (${failure!.code}: ${failure!.message}). ` +
            "The dispatch path was still exercised end to end.",
        );
        return;
      }

      createdAttempts.push(result.id);

      expect(result.status).toBe("scored");
      expect(result.overall_band).toBeGreaterThanOrEqual(1);
      expect(result.overall_band).toBeLessThanOrEqual(9);
      // Bands live on the half-band grid or they are not IELTS bands.
      expect((result.overall_band * 2) % 1).toBe(0);

      expect(result.criteria).toHaveLength(4);
      expect(result.criteria.map((c) => c.code)).toEqual(
        types.CRITERIA_BY_TASK.TASK_2,
      );

      for (const criterion of result.criteria) {
        // The locale was "vi", and both languages are guaranteed non-empty by
        // criteria_match_task() — an empty panel here would mean the mapping, not the
        // model, lost the text.
        expect(criterion.comment.trim().length).toBeGreaterThan(0);
        expect(criterion.improvement.trim().length).toBeGreaterThan(0);
        expect((criterion.band * 2) % 1).toBe(0);

        // Every quote must be in the learner's own essay. Verification happens
        // server-side; this asserts nothing fabricated survived the trip.
        for (const quote of criterion.evidence_quotes) {
          expect(ESSAY.toLowerCase().replace(/\s+/g, " ")).toContain(
            quote.toLowerCase().replace(/\s+/g, " "),
          );
        }
      }

      // Under 250 words, so the shortfall must be reflected rather than hidden.
      expect(result.provisional).toBe(true);
      expect(result.length_penalty).toBeGreaterThan(0);
      expect(result.pipeline_version).toBe("pipeline-v3.2");

      // A stored result must be reopenable — this is what the result screen does on a
      // refresh, and it goes through RLS as the learner rather than as the marker.
      const reread = await api.getResult(result.id, "vi");
      expect(reread.overall_band).toBe(result.overall_band);
    },
    240_000,
  );
});
