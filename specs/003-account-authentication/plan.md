# Implementation Plan: Account Authentication

**Branch**: `003-account-authentication` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-account-authentication/spec.md`

## Summary

A visitor can create an account and sign in with email + password; once signed in, they stay
recognized across the app (silent token refresh) until they sign out or an extended period of
inactivity passes. Technical approach: short-lived JWT access tokens (stateless, fast to verify)
paired with a DB-backed, hashed, rotating refresh token (so sign-out and reuse detection are
immediate and real, which a pure stateless JWT scheme cannot provide). This feature extends the
existing `backend/` FastAPI app and `users` table from `001-ielts-score-assessment`, implements
the real `backend/src/api/deps.py` bearer-auth dependency that feature `001` stubbed, and exposes
a small frontend auth client/hook that `002-core-app-ux`'s pages will call — it does not build the
sign-up/sign-in page UI itself.

## Technical Context

**Language/Version**: Backend: Python 3.12 (same FastAPI app as `001`). Frontend: TypeScript on
the same Next.js app as `002` — this feature adds an auth client/hook, not new pages.

**Primary Dependencies**: Backend (additions to `001`'s stack): PyJWT (JWT encode/decode),
argon2-cffi (password hashing). Reused as-is: FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2.
Frontend: no new library — native `fetch` + a React context/hook.

**Storage**: PostgreSQL — same database as `001`. Extends the `users` table with authentication
fields and adds one new table, `refresh_sessions`.

**Testing**: pytest — unit tests for password hashing and JWT encode/verify; contract tests for
`signup`/`signin`/`refresh`/`signout`/`me`; integration tests for the full
signup → access-protected-endpoint → refresh → signout flow and for refresh-token reuse
detection. Frontend: the Vitest/Playwright toolchain established in `002`'s plan, extended to
cover the auth hook.

**Target Platform**: Same as `001`/`002` — backend runs locally behind Cloudflare Tunnel
(`rexsantech.com`), frontend on Vercel. Backend and frontend are cross-origin.

**Project Type**: Web application — extends the existing `backend/` + `frontend/` split; no new
top-level project.

**Performance Goals**: Sign-up/sign-in respond within ~1s p95 (Argon2id hashing is deliberately
slow but tuned to ~200–500ms); token refresh responds within ~200ms (JWT verify + one indexed DB
lookup, no hashing on the hot path).

**Constraints**: Passwords are never stored or logged in plaintext (Constitution VII). Refresh
tokens are stored only as hashes, never raw (defense in depth if the DB leaks). Access tokens are
short-lived (≤30 minutes) to bound the exposure window of a token that can't be individually
revoked. Sign-out and reuse detection MUST take effect through server-side state — a purely
stateless JWT scheme cannot satisfy spec SC-004 ("sign-out takes effect immediately"), which is
why refresh sessions are DB-backed.

**Scale/Scope**: Same solo-maintained SaaS scale as `001`/`002`. A single Postgres table is
sufficient for sessions; no distributed session store needed yet.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — see below.*

| Principle | Gate | Status |
|---|---|---|
| I. Rubric-Grounded, Explainable Scoring | N/A — this feature has no scoring/explanation surface | N/A |
| II. Teach-to-Improve Guidance | N/A | N/A |
| III. Test-First Development | Contract, unit, and integration tests written before implementation | PASS |
| IV. Evaluation-Driven Methodology Changes | N/A — no LLM/scoring methodology involved | N/A |
| V. Cost-Conscious LLM Usage | N/A — no LLM calls in this feature | N/A |
| VI. Simplicity & Reusable Design | Reuses the existing `users` table and FastAPI app; adds exactly one new table (`refresh_sessions`); OAuth/password-reset explicitly deferred rather than scaffolded speculatively | PASS |
| VII. Observability, Error Handling & Security by Default | Central to this feature: Argon2id hashing, generic non-enumerating error messages, revocable/rotating sessions, failed-attempt throttling, structured auth-event logging without logging credentials | PASS |

No violations — Complexity Tracking table omitted.

**Post-Phase-1 re-check**: The refresh-token rotation-with-reuse-detection design
(research.md decision 5) and the failed-sign-in throttling design (decision 6) are the only
additions beyond the base token scheme, both justified directly against Principle VII. No new
violations — all rows above still PASS/N/A.

## Project Structure

### Documentation (this feature)

```text
specs/003-account-authentication/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── auth-openapi.yaml
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

This feature extends the `backend/` and `frontend/` trees established by `001` and `002`'s
plans; it does not introduce new top-level directories.

```text
backend/src/
├── security/                    # NEW
│   ├── passwords.py              # Argon2id hash/verify
│   └── tokens.py                 # JWT encode/verify, refresh-token generation/hashing
├── domain/auth/                  # NEW — Account/Session domain logic, reuse detection rules
├── infrastructure/database/
│   └── models.py                 # MODIFIED — extend User with password_hash/display_name;
│                                  # add RefreshSession
├── api/
│   ├── auth.py                   # NEW — signup/signin/refresh/signout/me routes
│   └── deps.py                   # MODIFIED — real bearer-auth dependency (001 left this stubbed)
└── tests/{contract,integration,unit}/  # auth test files alongside 001's

frontend/src/
├── lib/auth.ts                   # NEW — signup/signin/signout calls, silent-refresh scheduling
└── hooks/useAuth.ts              # NEW — auth context/hook consumed by 002's pages
```

**Structure Decision**: No new project — this feature adds a `security/` module and `domain/auth/`
to the existing backend, extends `infrastructure/database/models.py` and fills in the
already-stubbed `api/deps.py`, and adds a thin frontend auth client/hook for `002` to consume.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
