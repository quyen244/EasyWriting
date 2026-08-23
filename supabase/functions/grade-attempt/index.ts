// grade-attempt — the marking worker.
//
// Constitution VIII: the client never calls this. A learner inserts a row into
// `writing_attempts` with `status = 'queued'` and watches that row over realtime; a
// database trigger dispatches here, and the only thing that ever writes a band is this
// function, running as service_role. RLS makes that structural rather than a
// convention — `authenticated` holds no INSERT grant on any score-bearing column.
//
// The pipeline is `pipeline-v3.0`: four criterion calls, one per rubric, issued
// TOGETHER via Promise.all. They are independent — no criterion's judgement depends on
// another's — so concurrency cuts wall-clock latency at identical spend: the same four
// calls either way. The single-call alternative was built and benchmarked in Phase A
// and rejected; it was ~40% more tokens and roughly twice as slow, because one long
// generation has nothing left to run in parallel
// (specs/00-grading-feature/phase-a-findings.md).
//
// Everything numeric happens in code around the model — word counts, the length
// penalty, band snapping, the overall average — never inside it. That is what makes a
// stored band reproducible from its inputs.

import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.58.0";

import { aggregateOverall, clamp, lengthPenalty, snapBand } from "./aggregate.ts";
import { extractFeatures } from "./extract.ts";
import { findUnscoreableReason } from "./gate.ts";
import { CRITERIA_BY_TASK, CRITERION_NAMES, PIPELINE, TASK_CRITERIA } from "./generated/assets.ts";
import { callCriterion, type LlmResult } from "./openrouter.ts";
import { buildCriterionMessages } from "./prompt.ts";
import { dropUnverifiedQuotes } from "./verify.ts";

interface Attempt {
  id: string;
  user_id: string;
  task_type: string;
  prompt_text: string | null;
  essay_text: string;
  chart_description: string | null;
  status: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  // Who may call this. `verify_jwt` already stops anonymous traffic, but a learner's
  // own JWT passes that check too — this shared secret is what limits the function to
  // the dispatcher. It lives in Vault and is read by the trigger, never by a client.
  const expected = Deno.env.get("GRADE_ATTEMPT_SECRET") ?? "";
  if (!expected || req.headers.get("x-grade-secret") !== expected) {
    return json({ error: "forbidden" }, 403);
  }

  let attemptId: string;
  try {
    attemptId = (await req.json())?.attempt_id;
    if (typeof attemptId !== "string" || !attemptId) throw new Error("attempt_id required");
  } catch (err) {
    return json({ error: (err as Error).message }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Claim the row. `status = 'queued'` in the WHERE clause is the lock: the dispatch
  // trigger and the stuck-row sweeper can both aim at the same attempt, and exactly one
  // of them gets a row back. Without this, a swept row could be marked twice and the
  // learner would be billed twice for one essay.
  const { data: claimed, error: claimError } = await supabase
    .from("writing_attempts")
    .update({ status: "scoring" })
    .eq("id", attemptId)
    .eq("status", "queued")
    .select("id, user_id, task_type, prompt_text, essay_text, chart_description, status")
    .maybeSingle();

  if (claimError) return json({ error: claimError.message }, 500);
  if (!claimed) {
    // Already claimed, already finished, or gone. Not an error: the sweeper is
    // *expected* to lose this race most of the time.
    return json({ skipped: true, reason: "attempt is not queued" });
  }

  const attempt = claimed as Attempt;

  try {
    return await grade(supabase, attempt);
  } catch (err) {
    // Nothing may leave this row in `scoring` — that is the state the sweeper would
    // have to rescue, and an in-process crash is not something to make it wait for.
    await fail(supabase, attempt.id, "INTERNAL_ERROR");
    console.error(JSON.stringify({ event: "grade_crashed", attempt: attempt.id, error: String(err) }));
    return json({ error: "grading failed" }, 500);
  }
});

async function fail(supabase: SupabaseClient, id: string, code: string): Promise<void> {
  await supabase
    .from("writing_attempts")
    .update({ status: "failed", error_code: code })
    .eq("id", id);
}

async function grade(supabase: SupabaseClient, attempt: Attempt): Promise<Response> {
  const started = Date.now();
  const features = extractFeatures(attempt.essay_text, attempt.task_type);

  // The gate runs before a single token is spent, so junk costs zero LLM calls.
  const rejection = findUnscoreableReason(attempt.essay_text, features);
  if (rejection) {
    await supabase
      .from("writing_attempts")
      .update({ status: "rejected", error_code: rejection.code })
      .eq("id", attempt.id);
    console.log(JSON.stringify({
      event: "attempt_rejected",
      attempt: attempt.id,
      code: rejection.code,
    }));
    return json({ status: "rejected", code: rejection.code, reason: rejection.reason });
  }

  const penalty = lengthPenalty(features.lengthDeficitRatio, PIPELINE.lengthPenalty);
  const codes = CRITERIA_BY_TASK[attempt.task_type] ?? CRITERIA_BY_TASK.TASK_2;
  const apiKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";

  // ── The four calls ──────────────────────────────────────────────────────────
  // Issued together, not one after another. Promise.all rather than allSettled: every
  // rejection path inside callCriterion already returns a result object, so a thrown
  // exception here is a genuine bug and should surface, not be swallowed into a
  // "failed criterion" that looks like a model problem.
  const results = await Promise.all(
    codes.map((criterion) =>
      callCriterion({
        apiKey,
        node: `criterion:${criterion}`,
        messages: buildCriterionMessages({
          taskType: attempt.task_type,
          criterion,
          essayText: attempt.essay_text,
          features,
          promptText: attempt.prompt_text,
          chartDescription: attempt.chart_description,
        }),
      })
    ),
  );

  // Recorded before anything else can fail. Constitution VII: every paid, fallible call
  // is written down durably whether or not the assessment it belonged to succeeded —
  // the failures are the ones worth knowing about.
  await recordCalls(supabase, attempt, results);

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    // No partial result is ever shippable: Constitution I forbids a band without its
    // explanation, and criteria_match_task() requires all four regardless.
    await fail(supabase, attempt.id, failed[0].status === "rate_limited"
      ? "RATE_LIMITED"
      : "SCORING_FAILED");
    console.warn(JSON.stringify({
      event: "assessment_failed",
      attempt: attempt.id,
      failures: failed.map((f) => `${f.node}: ${f.error}`),
    }));
    return json({ status: "failed", failures: failed.length }, 502);
  }

  // ── Deterministic post-processing ───────────────────────────────────────────
  let quotesReturned = 0;
  let quotesKept = 0;

  const criteria = codes.map((code, i) => {
    const block = results[i].parsed!;
    const { band: rawBand } = snapBand(block.band);

    // Under-length is absorbed by the task criterion alone, never spread across all
    // four — otherwise one shortcoming is marked down four times.
    const applied = TASK_CRITERIA.has(code) ? penalty : 0;
    const band = applied ? Math.round(clamp(rawBand - applied) * 10) / 10 : rawBand;

    const { kept, dropped } = dropUnverifiedQuotes(block.evidence, attempt.essay_text);
    quotesReturned += block.evidence.length;
    quotesKept += kept.length;
    if (dropped) {
      console.warn(JSON.stringify({
        event: "quotes_dropped", attempt: attempt.id, criterion: code, dropped,
      }));
    }

    return {
      code,
      label: CRITERION_NAMES[code] ?? code,
      band,
      raw_band: rawBand,
      length_penalty_applied: applied,
      confidence: clamp(block.confidence, 0, 1),
      // Kept out of `comment`: this is the examiner-facing reasoning that produced the
      // band, in the model's own words, and it is what makes a disputed mark auditable.
      justification: block.justification,
      descriptor_reference: block.descriptor_reference,
      comment: block.comment,
      improvement: block.improvement,
      // Objects, not bare strings: each quote keeps the commentary explaining why it
      // supports the band. A reader flattening these to strings loses that, so the
      // richer shape is stored and the flattening left to whoever displays it.
      evidence: kept,
    };
  });

  const { overall, partial } = aggregateOverall(criteria.map((c) => c.band));
  if (partial) {
    // Unreachable — a failed call would have returned above — kept so this function
    // cannot ever write a row that `scored_rows_are_complete` would have to catch.
    await fail(supabase, attempt.id, "SCORING_FAILED");
    return json({ status: "failed", failures: 4 }, 502);
  }

  const { error: writeError } = await supabase
    .from("writing_attempts")
    .update({
      status: "scored",
      overall_band: overall,
      criteria,
      length_penalty: penalty,
      // Overwritten with this side's count, not left as the browser's. The two
      // tokenisers can disagree by a word or two, and a result screen showing a
      // different number from the one the model was handed is the kind of small
      // inconsistency that makes a learner doubt the band.
      word_count: features.wordCount,
      // An essay under the minimum is marked on less evidence than the rubric assumes,
      // so the band is flagged as what it is: an early estimate.
      provisional: !features.meetsMinWords,
      pipeline_version: PIPELINE.version,
      prompt_version: PIPELINE.promptVersion,
      model_id: PIPELINE.model.id,
      scored_at: new Date().toISOString(),
      error_code: null,
    })
    .eq("id", attempt.id);

  if (writeError) {
    // Most likely criteria_match_task() rejecting the payload — a shape bug on this
    // side, not a model failure. Recorded as failed so the learner is not left waiting.
    await fail(supabase, attempt.id, "RESULT_REJECTED");
    console.error(JSON.stringify({
      event: "result_write_rejected", attempt: attempt.id, error: writeError.message,
    }));
    return json({ error: writeError.message }, 500);
  }

  console.log(JSON.stringify({
    event: "attempt_scored",
    attempt: attempt.id,
    overall_band: overall,
    latency_ms: Date.now() - started,
    quote_fidelity: quotesReturned ? +(quotesKept / quotesReturned).toFixed(3) : 1,
    model: PIPELINE.model.id,
  }));

  return json({ status: "scored", overall_band: overall });
}

async function recordCalls(
  supabase: SupabaseClient,
  attempt: Attempt,
  results: LlmResult[],
): Promise<void> {
  const rows = results.map((r) => ({
    writing_attempt_id: attempt.id,
    user_id: attempt.user_id,
    pipeline_version: PIPELINE.version,
    prompt_version: PIPELINE.promptVersion,
    model_id: PIPELINE.model.id,
    status: r.status,
    latency_ms: r.latencyMs,
    prompt_tokens: r.promptTokens,
    completion_tokens: r.completionTokens,
    reasoning_tokens: r.reasoningTokens,
    cost_usd: r.costUsd,
    // attempts counts the first try; retries is what it cost beyond that.
    retry_count: Math.max(0, r.attempts - 1),
    bands_coerced: r.parsed ? snapBand(r.parsed.band).coerced : false,
    // The node and the failure reason, never the prompt: the prompt embeds the
    // learner's essay, and this table is audit evidence, not a second copy of it.
    raw_response: { node: r.node, error: r.error ?? null, band: r.parsed?.band ?? null },
  }));

  const { error } = await supabase.from("llm_calls").insert(rows);
  if (error) {
    // Losing the audit row must not lose the assessment — but it is a real gap in the
    // spend record, so it is logged loudly rather than swallowed.
    console.error(JSON.stringify({
      event: "llm_calls_insert_failed", attempt: attempt.id, error: error.message,
    }));
  }
}
