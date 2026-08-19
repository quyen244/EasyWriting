---
description: "Task list for feature implementation"
---

# Tasks: Account Authentication

**Input**: Design documents from `/specs/003-account-authentication/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/auth-openapi.yaml](./contracts/auth-openapi.yaml),
[quickstart.md](./quickstart.md)

**Tests**: Included — Constitution Principle III (Test-First Development) is NON-NEGOTIABLE.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story. This feature **extends** the `backend/`/`frontend/`
trees already created by `001-ielts-score-assessment` — Setup/Foundational tasks below add to
that existing codebase rather than recreating it (no new Dockerfile, docker-compose, or project
scaffolding here).

**Implementation note (2026-08-20)**: `001` had not yet been implemented when `/speckit-implement
003` ran, so the minimal shared prerequisite scaffold it would have produced (backend/frontend
directory trees, FastAPI app skeleton, Dockerfile/docker-compose, `Account` model + first Alembic
migration, structured logging/error-handling infra) was created as an explicit, separate
prerequisite step before Phase 1 below — not claimed as part of `001`'s own task list. All 37
tasks below are complete; see the completion report delivered in the implementing conversation
for the full verification trail (38 passing pytest tests, live curl validation of every
quickstart.md scenario, a clean frontend `tsc`/`eslint`/`next build`, and the T037 security
review). `useAuth` ended up at `frontend/src/hooks/useAuth.tsx` (not `.ts`) — React 19's
compiler-backed lint rules require real JSX for a context Provider; see T027.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Add this feature's new dependencies and configuration to the existing backend.

- [X] T001 Add `PyJWT` and `argon2-cffi` to `backend/requirements.txt`
      (research.md decisions 1–2)
- [X] T002 [P] Add JWT signing secret and access/refresh token lifetime settings to the existing
      `backend/src/core/config.py` `Settings` class

**Checkpoint**: Dependencies and config are in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model, security primitives, and the real auth dependency that every user story
needs.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Extend the existing `users` table (from `001`) with `password_hash`, `display_name`,
      `updated_at` columns via an Alembic migration in
      `backend/src/infrastructure/database/migrations/` (data-model.md Account)
- [X] T004 [P] Create the `RefreshSession` SQLAlchemy model (`refresh_sessions` table) + migration
      in `backend/src/infrastructure/database/models.py`, setting `expires_at = issued_at + 7
      days` on creation (data-model.md, research.md decision 3)
- [X] T005 [P] Create the `FailedSignInAttempt` SQLAlchemy model (`failed_signin_attempts` table)
      + migration in `backend/src/infrastructure/database/models.py` (data-model.md,
      research.md decision 6)
- [X] T006 [P] Implement Argon2id password hashing/verification in
      `backend/src/security/passwords.py` (research.md decision 2)
- [X] T007 [P] Implement JWT access-token encode/verify and refresh-token
      generation/hashing in `backend/src/security/tokens.py` (research.md decisions 1, 3, 4)
- [X] T008 Implement the real bearer-auth dependency in `backend/src/api/deps.py`, replacing the
      stub left by `001` — verifies the JWT and loads the `Account` (depends on: T007)
- [X] T009 [P] Define Pydantic schemas `SignupRequest`, `SigninRequest`, `Account`,
      `AuthResponse`, `AuthError` in `backend/src/core/schemas.py` per
      contracts/auth-openapi.yaml
- [X] T010 [P] Create the auth API client (raw `signup`/`signin`/`refresh`/`signout`/`me` calls,
      no state/context yet) in `frontend/src/lib/auth.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Create an account (Priority: P1)

**Goal**: A visitor can create an account with a unique email and password and is signed in
immediately afterward.

**Independent Test**: `POST /api/v1/auth/signup` with a new email/password returns 201 with an
access token and account details (quickstart.md Scenario 1).

### Tests for User Story 1 ⚠️

> Write these tests FIRST; confirm they FAIL before implementation.

- [X] T011 [P] [US1] Contract test for `POST /api/v1/auth/signup` — 201 success, 409 duplicate
      email, 400 weak password — in `backend/tests/contract/test_auth_signup.py`
- [X] T012 [P] [US1] Integration test: signup creates an `Account` row with a hashed (not
      plaintext) password and returns an access token plus a refresh-token cookie, in
      `backend/tests/integration/test_signup_flow.py`
- [X] T013 [P] [US1] Unit tests for password hashing — hash/verify round-trip and weak-password
      rejection — in `backend/tests/unit/test_passwords.py`

### Implementation for User Story 1

- [X] T014 [US1] Implement `POST /api/v1/auth/signup` in `backend/src/api/auth.py`: validate
      email uniqueness and password strength, hash the password, create the `Account`, issue an
      access token and a refresh session, set the refresh cookie (depends on: T003, T006, T007,
      T009)
- [X] T015 [US1] Implement email-uniqueness and password-strength validation, returning
      `EMAIL_ALREADY_REGISTERED`/`WEAK_PASSWORD`, in `backend/src/domain/auth/` (depends on: T014)
- [X] T016 [P] [US1] Implement `signUp()` in `frontend/src/lib/auth.ts` calling `POST /signup`
      (depends on: T010)

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Sign in and stay signed in (Priority: P1)

**Goal**: A learner signs in and remains recognized as signed in via silent token refresh, without
re-entering credentials.

**Independent Test**: Sign in, call `GET /api/v1/auth/me` with the access token, then call
`POST /api/v1/auth/refresh` and confirm a new access token is issued (quickstart.md Scenarios 2–3).

### Tests for User Story 2 ⚠️

- [X] T017 [P] [US2] Contract test for `POST /api/v1/auth/signin` — 200 success, 401 generic
      invalid-credentials — in `backend/tests/contract/test_auth_signin.py`
- [X] T018 [P] [US2] Contract test for `POST /api/v1/auth/refresh` — 200 rotates the session, 401
      on missing/expired token — in `backend/tests/contract/test_auth_refresh.py`
- [X] T019 [P] [US2] Contract test for `GET /api/v1/auth/me` — 200 authenticated, 401
      unauthenticated/expired — in `backend/tests/contract/test_auth_me.py`
- [X] T020 [P] [US2] Integration test: sign in → access `/me` → refresh → new access token works,
      in `backend/tests/integration/test_signin_refresh_flow.py`
- [X] T021 [P] [US2] Integration test: reusing an already-rotated refresh token revokes all of the
      account's sessions (research.md decision 5), in
      `backend/tests/integration/test_refresh_reuse_detection.py`
- [X] T022 [P] [US2] Unit tests for JWT encode/verify — valid, expired, tampered — in
      `backend/tests/unit/test_tokens.py`

### Implementation for User Story 2

- [X] T023 [US2] Implement `POST /api/v1/auth/signin` in `backend/src/api/auth.py`: verify
      credentials with a generic error on failure, issue access token + refresh session (depends
      on: T006, T007, T009, T014)
- [X] T024 [US2] Implement `POST /api/v1/auth/refresh` in `backend/src/api/auth.py`: verify and
      atomically rotate the refresh session (depends on: T004, T007, T023)
- [X] T025 [US2] Implement `GET /api/v1/auth/me` in `backend/src/api/auth.py` (depends on: T008)
- [X] T026 [US2] Implement refresh-session rotation and reuse-detection logic in
      `backend/src/domain/auth/sessions.py` (depends on: T004, T024)
- [X] T027 [P] [US2] Implement `useAuth` hook with silent-refresh scheduling in
      `frontend/src/hooks/useAuth.ts` (depends on: T010, T016)
- [X] T028 [US2] Wire `signIn()`/`me()` into `frontend/src/lib/auth.ts` and the `useAuth` context
      (depends on: T023, T025, T027)

**Checkpoint**: User Stories 1 AND 2 both work independently — the core sign-up/sign-in/stay-signed-in
loop is complete.

---

## Phase 5: User Story 3 - Sign out (Priority: P2)

**Goal**: A signed-in learner can sign out, immediately ending that session.

**Independent Test**: Sign in, sign out, then confirm a subsequent `/refresh` call with the same
(now-revoked) cookie fails (quickstart.md Scenario 4).

### Tests for User Story 3 ⚠️

- [X] T029 [P] [US3] Contract test for `POST /api/v1/auth/signout` — 204, and a subsequent
      `/refresh` with the same cookie fails — in `backend/tests/contract/test_auth_signout.py`
- [X] T030 [P] [US3] Integration test: sign-out revokes the refresh session immediately (spec
      SC-004), in `backend/tests/integration/test_signout_flow.py`

### Implementation for User Story 3

- [X] T031 [US3] Implement `POST /api/v1/auth/signout` in `backend/src/api/auth.py`: revoke the
      refresh session and clear the cookie (depends on: T004, T008, T024)
- [X] T032 [US3] Implement `signOut()` in `frontend/src/lib/auth.ts` and clear local auth state in
      `useAuth` (depends on: T027, T031)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T033 [P] Implement failed-sign-in throttling (`429 TOO_MANY_ATTEMPTS`) in
      `backend/src/domain/auth/throttle.py`, wired into the signin endpoint (research.md
      decision 6; depends on: T005, T023)
- [X] T034 [P] Add structured auth-event logging (signup/signin/refresh/signout/failed-attempt)
      that never logs credentials or token values, in `backend/src/api/auth.py` (Constitution
      Principle VII)
- [X] T035 [P] Contract test for the `429` throttling response in
      `backend/tests/contract/test_auth_throttle.py` (depends on: T033)
- [X] T036 Execute quickstart.md validation Scenarios 1–5 end-to-end and record results
- [X] T037 [P] Security review: confirm `password_hash`/`token_hash` are never logged or returned
      in any response body, and the refresh cookie has `HttpOnly`, `Secure`, `SameSite=None` set
      correctly (Constitution Principle VII)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P1) reuses US1's signup endpoint pattern (T023 depends on T014) but is independently
    testable via its own signin flow once an account exists.
  - US3 (P2) depends on US2's refresh-session machinery (T031 depends on T024).
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within Each User Story

- Tests (T011–T013, T017–T022, T029–T030) are written and confirmed failing before their
  corresponding implementation tasks (Constitution Principle III).
- Security primitives/models before endpoints before frontend wiring.

### Parallel Opportunities

- T001–T002 (Setup) can run in parallel.
- T004–T010 (Foundational, after T003) can run in parallel.
- All US1 test tasks (T011–T013) can run in parallel; all US2 test tasks (T017–T022) can run in
  parallel; all US3 test tasks (T029–T030) can run in parallel.
- T027 (frontend `useAuth`) can proceed in parallel with T023–T026 (backend signin/refresh/me)
  once T010/T016 are done, since it only needs the API client shape, not the live endpoints.

---

## Parallel Example: User Story 2

```bash
# Tests together:
Task: "Contract test for POST /api/v1/auth/signin in backend/tests/contract/test_auth_signin.py"
Task: "Contract test for POST /api/v1/auth/refresh in backend/tests/contract/test_auth_refresh.py"
Task: "Contract test for GET /api/v1/auth/me in backend/tests/contract/test_auth_me.py"
Task: "Integration test for signin+refresh flow in backend/tests/integration/test_signin_refresh_flow.py"
Task: "Integration test for refresh reuse detection in backend/tests/integration/test_refresh_reuse_detection.py"
Task: "Unit tests for JWT encode/verify in backend/tests/unit/test_tokens.py"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — account creation is not useful without staying signed in)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: run quickstart.md Scenarios 1–3 — this is the minimum viable auth loop
   that `001` and `002` can build on
6. Add User Story 3 (sign out) → validate → this feature is complete
7. Phase 6 Polish → throttling, logging, security review

### Note on downstream features

Once US1+US2 are done, `backend/src/api/deps.py` (T008) is real — `001`'s essay-submission
endpoint and `002`'s workspace/profile pages can be wired to actual auth instead of the stub they
were built against.

## Notes

- Constitution Principle III (Test-First) is non-negotiable — do not skip the test tasks.
- Constitution Principle VII is central to this entire feature — T037's security review is not
  optional polish, it is the feature's core promise.
- Commit after each task or logical group; stop at any checkpoint to validate independently.
