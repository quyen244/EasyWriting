# Specification ledger

Status of every specification in this project. Update this file whenever a spec changes status,
so a reader landing on a stale spec can find out what happened to it without reading git history.

| Spec | Status | Notes |
|---|---|---|
| [001-ielts-score-assessment](./001-ielts-score-assessment/) | **Ready for implementation** | The **standalone grader**: one task per request, `task_type` supplied by the caller, one LLM call (`pipeline-v2.0`), bilingual per-criterion comments. Distinct from the mock test (separate, future spec using `writing_attempts`). Closes most of constitution TP-1 — see the v3.1.0 amendment. `tasks.md` regenerated 2026-08-21 — 44 tasks across Setup/Foundational/US1–US4/Polish. Deploying to the live Supabase project is explicitly excluded from automatic scope — requires go-ahead per push/command. |
| [002-core-app-ux](./002-core-app-ux/) | **Ready for implementation** | The **landing page alone** (`/`), grounded in the real `writewise` Figma design. Existing `frontend/landing/*` components rewritten in place, not rebuilt (research.md R1). No backend, no API, no database. **General Training scope decision still flagged, not resolved** — tasks build against the spec's documented default. `tasks.md` regenerated 2026-08-21 — 59 tasks across Setup/Foundational/US1–US6/Polish. |
| [003-account-authentication](./003-account-authentication/) | **Retired** | Authentication moved to Supabase Auth in constitution v3.0.0. Its requirements survive as a tombstone in that directory and carry forward to the Supabase platform spec. |

## Why 002 and 003 changed status

Constitution **v3.0.0** retired the self-hosted FastAPI + PostgreSQL + `cloudflared` backend and
made Supabase the platform of record. Both specs were written against the old stack:

- `003` specified an authentication service this project no longer builds — Supabase Auth
  provides it. What auth must *do* is unchanged; only who implements it changed.
- `002`, in its original form, depended on `003`'s HTTP endpoints (`POST /api/v1/auth/signup`,
  `GET /api/v1/auth/me`) and treated `stitch_writewise_ielts_editorial_saas` as its design source
  of truth, across four surfaces (landing, FAQ, workspace, profile). Neither held any longer, so
  `002` was rewritten — not just re-pointed at Supabase, but narrowed to the landing page alone
  and re-grounded in a real Figma design. It no longer depends on 003's HTTP contract at all: its
  CTAs point at the (separately owned) Supabase-platform auth feature and 001's grader by
  reference, not by API shape.

Read the constitution's Sync Impact Report for the full rationale.

## Planned

These do not exist yet. Listed so the gaps above have a visible destination:

- **Supabase platform** — auth via Supabase Auth, the `profiles` / `writing_attempts` schema,
  the job state machine (`status`), RLS policies, column-level grants protecting score columns,
  and the `llm_calls` observability table. Supersedes `003`.
- **Mock test experience** — the redesigned workspace UI/UX and the timed two-task exam flow.
  Supersedes the *workspace* portion of `002`'s original scope (not `002` itself, which now
  covers the landing page on its own).
- **FAQ page** and **Profile page** — both were part of `002`'s original four-surface bundle and
  lost their spec home when `002` narrowed to the landing page. Neither has a planned
  replacement yet.

A future **Speaking** feature is anticipated in the constitution but not yet specified. The
platform spec's data model and job contract must leave room for it (Principle VIII). The landing
page (`002`) already teases it as "Coming soon", which is the first place this roadmap item
becomes visible to an actual user.
