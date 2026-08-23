// Drives a live Supabase project's REST / Auth / Storage API exactly the way the browser
// will: publishable key only, never service_role. Anything this script can do, a signed-in
// learner can do from the devtools console — which is the whole point of running it.
//
// The suite writes real rows and deletes them again, so point it at a project you are
// willing to have written to. It restores the test account's display name and removes
// every row and object it creates.
//
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
//   SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<pooler-host>:5432/postgres?sslmode=require \
//   TEST_EMAIL=... TEST_PASSWORD=... TEST_OTHER_UID=<uuid of a different learner> \
//   node supabase/tests/api.mjs
//
// SUPABASE_DB_URL is needed for one thing only: standing in for the scoring pipeline,
// which runs as service_role. No learner token can write a band, so the half of the
// system that turns a submission into a result is unreachable without it.

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`missing env var ${name} — see the header of this file`);
    process.exit(2);
  }
  return v;
}

const BASE = required("SUPABASE_URL").replace(/\/$/, "");
const PUBKEY = required("SUPABASE_PUBLISHABLE_KEY");
const PG = required("SUPABASE_DB_URL");

const ME = { email: required("TEST_EMAIL"), password: required("TEST_PASSWORD") };
const OTHER_UID = required("TEST_OTHER_UID");

let pass = 0;
const failures = [];
const created = { writing: [], mockAttempt: [], practice: [] };

function ok(what, detail = "") {
  pass++;
  console.log(`  ok    ${what}${detail ? `  — ${detail}` : ""}`);
}
function bad(what, detail) {
  failures.push(`${what} — ${detail}`);
  console.log(`  FAIL  ${what}\n        ${detail}`);
}
function check(cond, what, detail = "") {
  cond ? ok(what, detail) : bad(what, detail || "condition was false");
}

async function fetchRetry(url, init, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw last;
}

async function api(path, { token, method = "GET", body, headers = {} } = {}) {
  const res = await fetchRetry(`${BASE}${path}`, {
    method,
    headers: {
      apikey: PUBKEY,
      Authorization: `Bearer ${token ?? PUBKEY}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* keep the raw text */
  }
  return { status: res.status, json, text };
}

// A denial must be a denial, not an empty list that merely looks like one, and not a
// 500 from a typo in the test. Only these two shapes count.
function denied(r) {
  return (
    (r.status === 401 || r.status === 403) ||
    (r.status === 400 && /permission denied|violates row-level security/i.test(r.text))
  );
}

const section = (t) => console.log(`\n${t}\n${"-".repeat(t.length)}`);

// Stand-in for the scoring pipeline: see the note at the top of the file.
import { execFileSync } from "node:child_process";
function sql(statement) {
  return execFileSync("psql", [PG, "-v", "ON_ERROR_STOP=1", "-tAc", statement], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PGCLIENTENCODING: "UTF8" },
  }).trim();
}
const q = (json) => json.split("'").join("''");
function criteria(task, bands) {
  const codes =
    task === "TASK_1"
      ? ["TASK_ACHIEVEMENT", "COHERENCE_COHESION", "LEXICAL_RESOURCE", "GRAMMATICAL_RANGE_ACCURACY"]
      : ["TASK_RESPONSE", "COHERENCE_COHESION", "LEXICAL_RESOURCE", "GRAMMATICAL_RANGE_ACCURACY"];
  return q(
    JSON.stringify(
      codes.map((code, i) => ({
        code,
        band: bands[i],
        comment: { en: "on " + code, vi: "ve " + code },
      })),
    ),
  );
}


// ---------------------------------------------------------------- anonymous

section("Anonymous (publishable key alone)");

for (const table of [
  "mock_tests",
  "mock_test_tasks",
  "practice_modules",
  "practice_exercises",
  "profiles",
  "writing_attempts",
  "llm_calls",
]) {
  const r = await api(`/rest/v1/${table}?select=id&limit=1`);
  const leaked = r.status === 200 && Array.isArray(r.json) && r.json.length > 0;
  check(
    !leaked,
    `anon cannot read ${table}`,
    `http=${r.status} ${leaked ? `LEAKED ${r.json.length} row(s)` : r.text.slice(0, 90)}`,
  );
}

for (const view of ["v_activity", "v_practice_progress"]) {
  const r = await api(`/rest/v1/${view}?select=user_id&limit=1`);
  const leaked = r.status === 200 && Array.isArray(r.json) && r.json.length > 0;
  check(!leaked, `anon cannot read ${view}`, `http=${r.status} ${r.text.slice(0, 90)}`);
}

// The views carry a blanket grant to anon, so try actually writing through one.
{
  const r = await api("/rest/v1/v_activity", {
    method: "POST",
    body: { id: crypto.randomUUID(), user_id: OTHER_UID, kind: "graded" },
  });
  check(denied(r) || r.status >= 400, "anon cannot write through v_activity", `http=${r.status} ${r.text.slice(0, 120)}`);
}

// ---------------------------------------------------------------- sign in

section("Sign in");

const auth = await api("/auth/v1/token?grant_type=password", {
  method: "POST",
  body: ME,
});
if (auth.status !== 200 || !auth.json?.access_token) {
  console.error(`  FAIL  sign in — http=${auth.status} ${auth.text.slice(0, 200)}`);
  process.exit(1);
}
const TOKEN = auth.json.access_token;
const UID = auth.json.user.id;
ok("password grant returns a session", `uid=${UID}`);
check(UID !== OTHER_UID, "the test signs in as the expected learner");

const t = { token: TOKEN };

// ---------------------------------------------------------------- content reads

section("Seeded content, read as a signed-in learner");

const expectations = [
  ["mock_tests", 2],
  ["mock_test_tasks", 4],
  ["practice_modules", 12],
  ["practice_exercises", 36],
];
for (const [table, n] of expectations) {
  const r = await api(`/rest/v1/${table}?select=*`, t);
  const got = Array.isArray(r.json) ? r.json.length : -1;
  check(r.status === 200 && got === n, `${table} returns ${n} rows`, `http=${r.status} got=${got}`);
}

{
  const r = await api("/rest/v1/mock_tests?select=id,title&order=position", t);
  const vi = r.json?.[0]?.title?.vi;
  check(vi === "Viết học thuật — Đề 1", "Vietnamese survives the REST round-trip", `got=${JSON.stringify(vi)}`);
}

{
  // The embedded read is what the mock-test page will actually issue.
  const r = await api(
    "/rest/v1/mock_tests?select=id,title,mock_test_tasks(task_type,min_words,suggested_minutes)&order=position",
    t,
  );
  const tasks = r.json?.[0]?.mock_test_tasks;
  check(
    r.status === 200 && Array.isArray(tasks) && tasks.length === 2,
    "the foreign key lets a test embed its tasks",
    `http=${r.status} tasks=${tasks?.length}`,
  );
}

{
  const r = await api("/rest/v1/practice_modules?select=id,trains,practice_exercises(id)", t);
  const missing = (r.json ?? []).filter((m) => !m.practice_exercises?.length);
  check(r.status === 200 && missing.length === 0, "every practice module embeds its exercises", `orphans=${missing.length}`);
}

// ---------------------------------------------------------------- isolation

section("Isolation between learners");

{
  const r = await api("/rest/v1/profiles?select=id,email,full_name", t);
  const rows = r.json ?? [];
  check(
    r.status === 200 && rows.length === 1 && rows[0].id === UID,
    "profiles shows exactly one row: mine",
    `http=${r.status} rows=${rows.length}`,
  );
}

{
  const r = await api(`/rest/v1/profiles?select=id&id=eq.${OTHER_UID}`, t);
  check(r.status === 200 && (r.json ?? []).length === 0, "asking for another learner's profile returns nothing", `rows=${r.json?.length}`);
}

{
  const r = await api(`/rest/v1/profiles?id=eq.${UID}`, {
    ...t,
    method: "PATCH",
    body: { email: "hijacked@example.com" },
    headers: { Prefer: "return=representation" },
  });
  check(denied(r), "a learner cannot rewrite their own email column", `http=${r.status} ${r.text.slice(0, 110)}`);
}

{
  const before = await api(`/rest/v1/profiles?select=full_name&id=eq.${UID}`, t);
  const original = before.json?.[0]?.full_name ?? null;

  const r = await api(`/rest/v1/profiles?id=eq.${UID}`, {
    ...t,
    method: "PATCH",
    body: { full_name: "Quyền (api test)" },
    headers: { Prefer: "return=representation" },
  });
  check(r.status === 200 && r.json?.[0]?.full_name === "Quyền (api test)", "a learner can rename themselves", `http=${r.status}`);

  const back = await api(`/rest/v1/profiles?id=eq.${UID}`, {
    ...t,
    method: "PATCH",
    body: { full_name: original },
    headers: { Prefer: "return=representation" },
  });
  check(back.json?.[0]?.full_name === original, "the account name is put back as found", `full_name=${JSON.stringify(back.json?.[0]?.full_name)}`);
}

// ---------------------------------------------------------------- grader writes

section("Grader submissions");

const attemptId = crypto.randomUUID();
{
  const r = await api("/rest/v1/writing_attempts", {
    ...t,
    method: "POST",
    body: {
      id: attemptId,
      user_id: UID,
      skill: "writing",
      source: "grader",
      task_type: "TASK_2",
      prompt_text: "Some people think that … Discuss both views and give your own opinion.",
      essay_text: "x ".repeat(130).trim(),
      word_count: 130,
      min_words: 250,
    },
    headers: { Prefer: "return=representation" },
  });
  created.writing.push(attemptId);
  check(r.status === 201, "a learner can submit an essay", `http=${r.status} ${r.text.slice(0, 140)}`);
  check(r.json?.[0]?.status === "queued", "a fresh submission lands queued", `status=${r.json?.[0]?.status}`);
  check(r.json?.[0]?.overall_band === null, "a fresh submission carries no band", `band=${r.json?.[0]?.overall_band}`);
}

{
  const r = await api("/rest/v1/writing_attempts", {
    ...t,
    method: "POST",
    body: {
      id: crypto.randomUUID(),
      user_id: UID,
      skill: "writing",
      source: "grader",
      task_type: "TASK_2",
      prompt_text: "p",
      essay_text: "e",
      word_count: 1,
      min_words: 250,
      overall_band: 9,
      status: "scored",
    },
  });
  check(denied(r), "a learner cannot award themselves a band on insert", `http=${r.status} ${r.text.slice(0, 110)}`);
}

{
  const r = await api(`/rest/v1/writing_attempts?id=eq.${attemptId}`, {
    ...t,
    method: "PATCH",
    body: { overall_band: 9 },
  });
  check(denied(r), "a learner cannot UPDATE a submission at all", `http=${r.status} ${r.text.slice(0, 110)}`);
}

{
  const r = await api("/rest/v1/writing_attempts", {
    ...t,
    method: "POST",
    body: {
      id: crypto.randomUUID(),
      user_id: OTHER_UID,
      skill: "writing",
      source: "grader",
      task_type: "TASK_2",
      prompt_text: "p",
      essay_text: "e",
      word_count: 1,
      min_words: 250,
    },
  });
  check(denied(r), "a learner cannot file work under someone else's id", `http=${r.status} ${r.text.slice(0, 110)}`);
}

{
  // Task 1 fields on a Task 2 row must be refused by the CHECK constraint.
  const r = await api("/rest/v1/writing_attempts", {
    ...t,
    method: "POST",
    body: {
      id: crypto.randomUUID(),
      user_id: UID,
      skill: "writing",
      source: "grader",
      task_type: "TASK_2",
      prompt_text: "p",
      essay_text: "e",
      word_count: 1,
      min_words: 250,
      task1_overview: "not allowed here",
    },
  });
  check(r.status >= 400, "Task 1 fields are refused on a Task 2 row", `http=${r.status} ${r.text.slice(0, 110)}`);
}

// ---------------------------------------------------------------- mock sitting

section("Mock test sitting");

const sittingId = crypto.randomUUID();
{
  const r = await api("/rest/v1/mock_test_attempts", {
    ...t,
    method: "POST",
    body: { id: sittingId, user_id: UID, test_id: "mock_writing_01" },
    headers: { Prefer: "return=representation" },
  });
  created.mockAttempt.push(sittingId);
  check(r.status === 201, "a learner can start a sitting", `http=${r.status} ${r.text.slice(0, 140)}`);
  check(r.json?.[0]?.status === "in_progress", "a new sitting is in_progress", `status=${r.json?.[0]?.status}`);
}

{
  const r = await api(`/rest/v1/mock_test_attempts?id=eq.${sittingId}`, {
    ...t,
    method: "PATCH",
    body: { status: "scored", combined_band: 9 },
  });
  check(denied(r), "a learner cannot set their own sitting to scored", `http=${r.status} ${r.text.slice(0, 110)}`);
}

{
  const r = await api(`/rest/v1/mock_test_attempts?id=eq.${sittingId}`, {
    ...t,
    method: "PATCH",
    body: { submitted_at: new Date().toISOString(), elapsed_seconds: 1800 },
    headers: { Prefer: "return=representation" },
  });
  check(
    r.status === 200 && r.json?.[0]?.status === "submitted",
    "handing in flips the sitting to submitted via the trigger",
    `http=${r.status} status=${r.json?.[0]?.status}`,
  );
}

// ---------------------------------------------------------------- practice

section("Practice");

const practiceId = crypto.randomUUID();
{
  const mod = await api("/rest/v1/practice_modules?select=id&order=position&limit=1", t);
  const modId = mod.json?.[0]?.id;
  const ex = await api(`/rest/v1/practice_exercises?select=id&module_id=eq.${modId}&order=position&limit=1`, t);
  const exId = ex.json?.[0]?.id;

  const r = await api("/rest/v1/practice_attempts", {
    ...t,
    method: "POST",
    body: { id: practiceId, user_id: UID, module_id: modId, exercise_id: exId, answer: "my rewritten sentence" },
    headers: { Prefer: "return=representation" },
  });
  created.practice.push(practiceId);
  check(r.status === 201, "a learner can record a practice attempt", `http=${r.status} ${r.text.slice(0, 140)}`);

  const upd = await api(`/rest/v1/practice_attempts?id=eq.${practiceId}`, {
    ...t,
    method: "PATCH",
    body: { answer: "edited" },
  });
  check(denied(upd), "practice attempts are immutable", `http=${upd.status} ${upd.text.slice(0, 110)}`);

  const prog = await api(`/rest/v1/v_practice_progress?select=*&module_id=eq.${modId}`, t);
  const row = prog.json?.[0];
  check(
    prog.status === 200 && row && row.completed_count >= 1,
    "v_practice_progress counts the attempt",
    `http=${prog.status} completed=${row?.completed_count}/${row?.exercise_count}`,
  );
}

// ---------------------------------------------------------------- derived reads

section("Derived views and RPC");

{
  const r = await api("/rest/v1/v_activity?select=*&order=at.desc&limit=10", t);
  const rows = r.json ?? [];
  const foreign = rows.filter((x) => x.user_id !== UID);
  check(r.status === 200 && rows.length > 0, "v_activity returns my activity", `http=${r.status} rows=${rows.length}`);
  check(foreign.length === 0, "v_activity leaks no one else's activity", `foreign=${foreign.length}`);
  // v_activity is defined over status='scored' only, so the queued submission above is
  // correctly absent — an essay still in the queue has no result page to link to.
  check(
    !rows.some((x) => x.kind === "graded"),
    "a queued submission is not yet activity",
    `kinds=${[...new Set(rows.map((x) => x.kind))].join(",")}`,
  );
}

{
  const r = await api("/rest/v1/rpc/get_progress_summary", { ...t, method: "POST", body: {} });
  const s = r.json;
  check(r.status === 200 && s && typeof s === "object", "get_progress_summary() answers", `http=${r.status} ${r.text.slice(0, 160)}`);
  if (s) console.log(`        ${JSON.stringify(s).slice(0, 300)}`);
}

// ---------------------------------------------------------------- scoring

section("After the pipeline scores the work (service-role stand-in)");

{
  sql(`update public.writing_attempts set status='scoring' where id='${attemptId}'`);
  const mid = await api(`/rest/v1/writing_attempts?select=status&id=eq.${attemptId}`, t);
  check(mid.json?.[0]?.status === "scoring", "the learner can watch the status move", `status=${mid.json?.[0]?.status}`);

  // A half-scored row must be refused: a result page showing a band with no criteria is
  // worse than no result at all.
  let refused = false;
  try {
    sql(`update public.writing_attempts set status='scored', overall_band=6.5 where id='${attemptId}'`);
  } catch {
    refused = true;
  }
  check(refused, "a scored row without criteria is refused");

  // And the criteria must carry both languages.
  let monolingual = false;
  try {
    const oneLang = q(
      JSON.stringify([
        { code: "TASK_RESPONSE", band: 6, comment: { en: "only english" } },
        { code: "COHERENCE_COHESION", band: 6.5, comment: { en: "x", vi: "y" } },
        { code: "LEXICAL_RESOURCE", band: 6, comment: { en: "x", vi: "y" } },
        { code: "GRAMMATICAL_RANGE_ACCURACY", band: 5.5, comment: { en: "x", vi: "y" } },
      ]),
    );
    sql(
      `update public.writing_attempts set status='scored', overall_band=6, criteria='${oneLang}'::jsonb,
       pipeline_version='v1', model_id='test', scored_at=now() where id='${attemptId}'`,
    );
  } catch {
    monolingual = true;
  }
  check(monolingual, "criteria missing the Vietnamese comment are refused");

  sql(
    `update public.writing_attempts set status='scored', overall_band=6.5,
     criteria='${criteria("TASK_2", [6, 7, 6.5, 6])}'::jsonb,
     pipeline_version='v1', prompt_version='p1', model_id='test-model', scored_at=now()
     where id='${attemptId}'`,
  );

  const done = await api(`/rest/v1/writing_attempts?select=*&id=eq.${attemptId}`, t);
  const row = done.json?.[0];
  check(
    row?.status === "scored" && row?.overall_band === 6.5,
    "the learner reads back the finished result",
    `status=${row?.status} band=${row?.overall_band}`,
  );
  check(Array.isArray(row?.criteria) && row.criteria.length === 4, "all four criteria come back", `n=${row?.criteria?.length}`);
  check(row?.criteria?.[0]?.comment?.vi?.length > 0, "the Vietnamese comment survives the round-trip");

  const act = await api("/rest/v1/v_activity?select=*&kind=eq.graded", t);
  check(
    (act.json ?? []).some((x) => x.id === attemptId && x.href === `/results/${attemptId}`),
    "the scored essay appears in v_activity with a working link",
    `rows=${act.json?.length}`,
  );

  const sum = await api("/rest/v1/rpc/get_progress_summary", { ...t, method: "POST", body: {} });
  const g = sum.json;
  check(g?.total_submissions === 1, "get_progress_summary counts the scored essay", `total=${g?.total_submissions}`);
  check(Number(g?.overall_average) === 6.5, "the average matches the band", `avg=${g?.overall_average}`);
  check(g?.criterion_averages?.length === 4, "criterion averages are broken out", `n=${g?.criterion_averages?.length}`);
  check(g?.strongest?.code === "COHERENCE_COHESION", "the strongest criterion is the one that scored 7", `strongest=${g?.strongest?.code}`);
  check(
    g?.weakest?.code === "TASK_RESPONSE" || g?.weakest?.code === "GRAMMATICAL_RANGE_ACCURACY",
    "the weakest criterion is one of the two that scored 6",
    `weakest=${g?.weakest?.code}`,
  );
  check(g?.total_words === 130, "words are counted from the submission", `words=${g?.total_words}`);
}

// ---------------------------------------------------------------- combined band

section("Combined band for a sitting");

{
  const t1 = crypto.randomUUID();
  const t2 = crypto.randomUUID();
  for (const [id, task, words] of [
    [t1, "TASK_1", 170],
    [t2, "TASK_2", 280],
  ]) {
    const r = await api("/rest/v1/writing_attempts", {
      ...t,
      method: "POST",
      body: {
        id,
        user_id: UID,
        skill: "writing",
        source: "mock_test",
        mock_attempt_id: sittingId,
        task_type: task,
        prompt_text: "seeded prompt",
        essay_text: "word ".repeat(words).trim(),
        word_count: words,
        min_words: task === "TASK_1" ? 150 : 250,
      },
    });
    check(r.status === 201, `a sitting accepts its ${task} essay`, `http=${r.status} ${r.text.slice(0, 120)}`);
    // Deliberately not queued for cleanup: the cascade from the sitting must remove them,
    // and deleting them here first would make that assertion pass for the wrong reason.
  }

  // Task 1 counts once, Task 2 twice: (6 + 7 + 7) / 3 = 6.67 -> 6.5
  sql(`update public.writing_attempts set status='scored', overall_band=6,
       criteria='${criteria("TASK_1", [6, 6, 6, 6])}'::jsonb,
       pipeline_version='v1', model_id='m', scored_at=now() where id='${t1}'`);
  sql(`update public.writing_attempts set status='scored', overall_band=7,
       criteria='${criteria("TASK_2", [7, 7, 7, 7])}'::jsonb,
       pipeline_version='v1', model_id='m', scored_at=now() where id='${t2}'`);

  const sitting = await api(`/rest/v1/mock_test_attempts?select=status,combined_band&id=eq.${sittingId}`, t);
  const row = sitting.json?.[0];
  check(Number(row?.combined_band) === 6.5, "Task 2 counts double and the band rounds to a half", `combined=${row?.combined_band}`);
  check(row?.status === "scored", "the sitting flips itself to scored", `status=${row?.status}`);

  const act = await api("/rest/v1/v_activity?select=*&kind=eq.mock_test", t);
  check((act.json ?? []).length === 1, "the sitting is one activity entry, not two", `rows=${act.json?.length}`);
  check(Number(act.json?.[0]?.band) === 6.5, "the entry carries the combined band", `band=${act.json?.[0]?.band}`);
}

// ---------------------------------------------------------------- cost ledger

section("Cost ledger stays private");

{
  const r = await api("/rest/v1/llm_calls?select=id&limit=1", t);
  const leaked = r.status === 200 && (r.json ?? []).length > 0;
  check(!leaked, "a signed-in learner cannot read llm_calls", `http=${r.status} ${r.text.slice(0, 90)}`);
}
{
  const r = await api("/rest/v1/llm_calls", {
    ...t,
    method: "POST",
    body: { id: crypto.randomUUID(), user_id: UID, provider: "x", model: "y" },
  });
  check(denied(r) || r.status >= 400, "a signed-in learner cannot write llm_calls", `http=${r.status} ${r.text.slice(0, 90)}`);
}

// ---------------------------------------------------------------- storage

section("Chart image storage");

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function upload(path, blobLike, contentType = "image/png") {
  const res = await fetchRetry(`${BASE}/storage/v1/object/chart-images/${path}`, {
    method: "POST",
    headers: { apikey: PUBKEY, Authorization: `Bearer ${TOKEN}`, "Content-Type": contentType, "x-upsert": "true" },
    body: blobLike,
  });
  return { status: res.status, text: await res.text() };
}

const myObject = `${UID}/api-test-${Date.now()}.png`;
{
  const r = await upload(myObject, png);
  check(r.status === 200, "a learner can upload into their own folder", `http=${r.status} ${r.text.slice(0, 120)}`);
}
{
  const r = await upload(`${OTHER_UID}/stolen-${Date.now()}.png`, png);
  check(r.status === 400 || r.status === 403, "a learner cannot upload into someone else's folder", `http=${r.status} ${r.text.slice(0, 120)}`);
}
{
  const res = await fetchRetry(`${BASE}/storage/v1/object/public/chart-images/${myObject}`, {});
  check(res.status !== 200, "the bucket is not readable without a token", `http=${res.status}`);
}
{
  const res = await fetchRetry(`${BASE}/storage/v1/object/chart-images/${myObject}`, {
    headers: { apikey: PUBKEY, Authorization: `Bearer ${TOKEN}` },
  });
  check(res.status === 200, "a learner can read their own upload with a token", `http=${res.status}`);
}
{
  const res = await fetchRetry(`${BASE}/storage/v1/object/chart-images/${myObject}`, {
    method: "DELETE",
    headers: { apikey: PUBKEY, Authorization: `Bearer ${TOKEN}` },
  });
  check(res.status === 200, "a learner can delete their own upload", `http=${res.status}`);
}
{
  // 5 MB limit, declared on the bucket.
  const big = Buffer.alloc(6 * 1024 * 1024, 1);
  const r = await upload(`${UID}/too-big-${Date.now()}.png`, big);
  check(r.status >= 400, "an oversized upload is refused", `http=${r.status} ${r.text.slice(0, 120)}`);
}
{
  const r = await upload(`${UID}/not-an-image-${Date.now()}.pdf`, png, "application/pdf");
  check(r.status >= 400, "a non-image upload is refused", `http=${r.status} ${r.text.slice(0, 120)}`);
}

// ---------------------------------------------------------------- cleanup

section("Cleanup");

for (const id of created.practice) {
  const r = await api(`/rest/v1/practice_attempts?id=eq.${id}`, { ...t, method: "DELETE" });
  check(r.status === 204 || r.status === 200, "the learner can delete their own practice attempt", `http=${r.status}`);
}
for (const id of created.writing) {
  const r = await api(`/rest/v1/writing_attempts?id=eq.${id}`, { ...t, method: "DELETE" });
  check(r.status === 204 || r.status === 200, "the learner can delete their own submission", `http=${r.status}`);
}
// mock_test_attempts has no DELETE grant by design; psql cleans it up afterwards.
// mock_test_attempts has no DELETE grant by design, so the stand-in connection clears it.
sql(`delete from public.mock_test_attempts where id='${sittingId}'`);
{
  const left = await api(`/rest/v1/writing_attempts?select=id&mock_attempt_id=eq.${sittingId}`, t);
  check((left.json ?? []).length === 0, "deleting a sitting cascades to its essays", `left=${left.json?.length}`);
}

// ---------------------------------------------------------------- sign out

section("Sign out");
{
  const r = await api("/auth/v1/logout", { ...t, method: "POST" });
  check(r.status === 204 || r.status === 200, "logout accepted", `http=${r.status}`);
  const after = await api("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: auth.json.refresh_token },
  });
  check(after.status >= 400, "the refresh token is dead after logout", `http=${after.status} ${after.text.slice(0, 90)}`);
}

console.log(`\n${"=".repeat(60)}`);
console.log(failures.length === 0 ? `ALL ${pass} ASSERTIONS PASSED` : `${pass} passed, ${failures.length} FAILED`);
for (const f of failures) console.log(`  - ${f}`);
process.exit(failures.length ? 1 : 0);
