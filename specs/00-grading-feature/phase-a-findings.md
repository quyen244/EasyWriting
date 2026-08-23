# Phase A findings — pipeline-v2.0 vs pipeline-v1.0

**Date**: 2026-08-23. Both runs below are **real model calls** (`nvidia/nemotron-3-super-120b-a12b:free`),
same 10 golden essays (`eval/data/golden/`), same day, same machine — an apples-to-apples
comparison, not a comparison against an old report.

**Important correction made while producing this**: every previously-existing 10-essay
report under `eval/data/reports/` (`20260820-112246-d17c`, `20260820-112338-8d3b`,
`20260820-115625-212e`) turns out to be a **`FakeLLMClient` run**, not a real benchmark —
their `explanation` text is literally the fake client's hardcoded template
(`"The essay matches the band {band} descriptor..."`) and every criterion returns the
same flat band. `docs/live-model-validation.md` itself says its one real call was to
*"test hệ thống... không phải đo độ chính xác"* (test the system, not measure accuracy).
**There has never been a real `pipeline-v1.0` accuracy benchmark in this repo before
today.** I ran one (`20260823-175455-518e`) specifically so this comparison is real vs
real, not real vs fake.

- v1 real run: `eval/data/reports/20260823-175455-518e/`
- v2 real run: `eval/data/reports/20260823-174535-2786/`

## Headline numbers

| Metric | pipeline-v1.0 (4 calls/essay) | pipeline-v2.0 (1 call/essay) | Verdict |
|---|---|---|---|
| LLM calls (10 essays) | 40 | 10 | ✅ 4x reduction, as designed (FR-001) |
| MAE (overall band vs gold) | 0.5 | 0.45 | ✅ v2 slightly better |
| within 0.5 band | 70% | **90%** | ✅ v2 clears the report's own 90% bar; v1 does not |
| within 1.0 band | **100%** | 90% | ⚠️ v1 slightly better (v2 has one essay off by 1.5 — see below) |
| Spearman rho (rank correlation) | **0.908** | 0.808 | ⚠️ v1 slightly better, but n=10 makes this noisy |
| Quote fidelity | 0.986 | 0.988 | ✅ parity |
| **Tokens per essay (total)** | **7,012** | **9,858** | ❌ v2 uses ~40% MORE tokens, not fewer |
| **p50 latency per essay** | **15.8s** | **32.7s** | ❌ v2 is ~2x slower |
| **p95 latency per essay** | 23.9s | **72.5s** | ❌ v2 **exceeds** spec.md SC-001's 60s target |

## What this means for spec.md's assumptions — two need correcting

**SC-004 ("cost drops to ~25% of v1's") is wrong as measured.** It assumed cost tracks
call count. It tracks **tokens**, and v2 uses more of them: one call now carries all 4
rubrics plus the few-shot worked example (system+first-user message alone: ~7,300 prompt
tokens, measured directly) instead of spreading one rubric per call across 4 smaller
prompts. On this `:free` model the dollar cost is $0 either way, so this did not cost
anything to discover — but on a paid model, **v2 would cost more per essay, not less.**
The real, confirmed benefit is 4x fewer *calls* (matters for RPM-limited free tiers,
retry/orchestration simplicity, and Constitution VII's "one llm_calls row per call"
bookkeeping being 4x smaller) — not fewer tokens.

**SC-001 ("95% within 60s") is at risk.** v1's concurrency (`asyncio.gather` over 4
calls) hid each call's individual latency behind the slowest of the four running in
parallel. v2 has no calls left to parallelize — one long generation, run serially, is
the entire critical path. Measured p95 is 72.5s against a 60s target, on n=10. This is
a structural property of consolidating to one call, not a bug to patch.

## A real bug found and partially fixed: Vietnamese output leaking other scripts

The first real single-essay test showed the model inserting stray Chinese ("còn犯 lỗi")
and Dutch ("zelfs ba từ") into `comment.vi`/`improvement.vi`. Added an explicit rule to
`prompts/v2/user.txt` ("MUST be written entirely in Vietnamese script..."). It reduced
but **did not eliminate** the problem: across the full 10-essay run, **6 of 80 vi-fields
(7.5%) still leak non-Vietnamese script** — mostly Chinese "冠词" (the grammar term
"article") substituted inside `GRAMMATICAL_RANGE_ACCURACY` specifically (4 of the 6
leaks), plus one Arabic phrase and one stray Thai character. This is not random noise —
it concentrates on one criterion and one linguistic term, which is an actionable, not
vague, next fix.

**Recommended next step, not yet done**: add a server-side check (same defense-in-depth
pattern already used for quote verification — prompt asks nicely, schema requires the
field, *code* verifies) that rejects a response containing non-Vietnamese-script
characters in a `vi` field and retries, rather than relying on the prompt instruction
alone. This is a small, well-scoped addition to the Edge Function's validation step
(spec.md §11, "Server-side validation before persistence") — it just was not built yet
because Phase A's job was proving the pipeline design, not hardening every edge case.

## One clear per-essay outlier, worth a second look

`T2-002`: gold overall 6.5, v2 predicted 8.0 (error +1.5 — the only essay over the 1.0-band
line). Three of four criteria came back a full 1.5 bands above the gold label
(`TASK_RESPONSE`, `LEXICAL_RESOURCE`, `GRAMMATICAL_RANGE_ACCURACY` all 8.0 vs gold 6.5),
while `COHERENCE_COHESION` matched exactly (7.0 vs 7.0). Worth noting: this essay's gold
label itself is `"confidence": "medium"`, same as all 10 — some of this gap may be label
uncertainty, not model error, but a single-essay swing this large is exactly the kind of
case a slightly larger golden set (Constitution IV: *"the golden dataset MUST grow from
production data"*) would clarify rather than leave ambiguous.

## What worked well, read directly from the output

Sample bilingual comments read as genuinely useful, specific, evidence-grounded feedback
— e.g. (from `T1-001`, `TASK_ACHIEVEMENT`, band 5.0):

> **en**: "You covered all four energy sources and gave figures for the start and end
> years... you never stepped back to give an overview sentence that summarises the two
> biggest stories — coal falling and renewables rising — so the response reads like a
> list rather than a summary, which is why it stays at band 5."
>
> **improvement.vi**: "Trước khi đi vào chi tiết, hãy viết một câu nêu hai thay đổi tổng
> thể quan trọng nhất: than giảm từ nguồn cao nhất xuống thấp nhất trong khi năng lượng
> tái tạo tăng từ thấp nhất lên cao nhất. Đặt câu đó ngay sau phần giới thiệu; đó chính
> là điều đưa bài từ band 5 lên band 6."

Full samples for 2 essays per run are in each run's `report.md` under "Sample bilingual
output"; every criterion for every essay is in `raw_results.json`.

## Constitution IV gate — where this leaves SC-002

`pipeline-v2.0` **passes** SC-002 as literally written (≥90% within 0.5 band: got 90%
exactly) on this 10-essay set, and does so more accurately than v1 does on the same set
today. That is a real, positive result. It is a 10-essay result, though — the
constitution's own text calls a set this size insufficient to *fully* carry a methodology
decision, which spec.md's Constitution Check already flagged going in, not a new caveat.

## Open decision for you

Quality: green light. Cost/latency: not what spec.md assumed, and the Vietnamese-script
leak needs one more fix before this is presentable to a learner. Three real options,
not mutually exclusive:

1. **Proceed to Phase B anyway** — cost is $0 on the free model regardless, and a
   30-70s "grading..." spinner may be acceptable UX; fix the script-leak with the
   server-side check above before it reaches a real learner.
2. **Tighten the v2 prompt first** — trim `comment`/`improvement` length targets to cut
   completion tokens (directly shortens latency, since generation is now the entire
   critical path), and add the script-leak retry check, then re-benchmark before Phase B.
3. **Revise spec.md's SC-001/SC-004** to match what was actually measured, so the
   record is accurate, before deciding either way.

I have not started Phase B. No Edge Function code exists yet.
