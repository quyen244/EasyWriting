# Specification ledger

Status of every specification in this project. Update this file whenever a spec changes status,
so a reader landing on a stale spec can find out what happened to it without reading git history.

| Spec | Status | Notes |
|---|---|---|
| [001-ielts-score-assessment](./001-ielts-score-assessment/) | **Planned — Phase 1 design complete** | The **standalone grader**: one task per request, `task_type` supplied by the caller, one LLM call (`pipeline-v2.0`), bilingual per-criterion comments. Distinct from the mock test (separate, future spec using `writing_attempts`). Closes most of constitution TP-1 — see the v3.1.0 amendment. `plan.md`/`research.md`/`data-model.md`/`quickstart.md`/`contracts/` regenerated 2026-08-21; `tasks.md` still stale pending `/speckit-tasks`. |
| [002-core-app-ux](./002-core-app-ux/) | **Superseded** | The landing/FAQ/workspace/profile UI is being redesigned from scratch against new visual references. Route structure and access rules are still worth reading; the API dependencies and the Stitch design references are obsolete. |
| [003-account-authentication](./003-account-authentication/) | **Retired** | Authentication moved to Supabase Auth in constitution v3.0.0. Its requirements survive as a tombstone in that directory and carry forward to the Supabase platform spec. |

## Why 002 and 003 changed status

Constitution **v3.0.0** retired the self-hosted FastAPI + PostgreSQL + `cloudflared` backend and
made Supabase the platform of record. Both specs were written against the old stack:

- `003` specified an authentication service this project no longer builds — Supabase Auth
  provides it. What auth must *do* is unchanged; only who implements it changed.
- `002` depends on `003`'s HTTP endpoints (`POST /api/v1/auth/signup`, `GET /api/v1/auth/me`)
  and treats `stitch_writewise_ielts_editorial_saas` as its design source of truth. Neither
  holds now.

Read the constitution's Sync Impact Report for the full rationale.

## Planned

These do not exist yet. Listed so the gaps above have a visible destination:

- **Supabase platform** — auth via Supabase Auth, the `profiles` / `writing_attempts` schema,
  the job state machine (`status`), RLS policies, column-level grants protecting score columns,
  and the `llm_calls` observability table. Supersedes `003`.
- **Mock test experience** — the redesigned UI/UX and the timed two-task exam flow.
  Supersedes `002`.

A future **Speaking** feature is anticipated in the constitution but not yet specified. The
platform spec's data model and job contract must leave room for it (Principle VIII).
