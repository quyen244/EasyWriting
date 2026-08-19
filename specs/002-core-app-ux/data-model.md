# Phase 1 Data Model: Core App UX (WriteWise revision)

This feature introduces **no new persisted entities** (research.md decision 4). It renders data
owned by other features and holds only transient, client-side view state.

## Entities owned elsewhere (referenced, not redefined)

- **Account** (`003-account-authentication`): `id`, `email`, `display_name` — shown on the
  profile page (FR-008) via `GET /api/v1/auth/me`.
- **EssaySubmission` / `AssessmentResult`** (`001-ielts-score-assessment`): rendered in the
  workspace (FR-005) via `POST /api/v1/assessments` / `GET /api/v1/assessments/{id}`.

## Transient client-side view state (not persisted, not an API contract)

### WorkspaceViewState

Exists only in the browser tab's memory while the workspace page is open.

| Field | Type | Notes |
|---|---|---|
| taskType | `TASK_1` \| `TASK_2` | mirrors `001`'s `AssessmentRequest.task_type` |
| promptText | string | learner-entered prompt |
| essayText | string | learner-entered essay; preserved across a failed/rejected submission (FR — "essay text remains in the input") |
| status | `idle` \| `submitting` \| `result` \| `error` | drives which of empty-state / in-progress / result / error UI renders (FR-006, FR-007) |
| result | `AssessmentResult` \| null | populated on success from `001`'s response; feeds the 2×2 criteria grid and expandable line-by-line feedback (FR-005) |
| error | `{ code, message }` \| null | populated from `001`'s 400/503 responses |

**Validation rules**: `essayText` is never cleared automatically on `error` — only a successful
new submission or an explicit learner action replaces it (User Story 2, acceptance scenario 3).

### ThemePreference

Exists client-side only, persisted to `localStorage`, not scoped to a signed-in session (research.md decision 5).

| Field | Type | Notes |
|---|---|---|
| mode | `light` \| `dark` | default `light`; toggled via `ThemeToggle.tsx`, applied as a `dark` class on `<html>` (FR-018) |

**Validation rules**: Must remain correctly applied through every `WorkspaceViewState.status`
transition — switching theme while `status === "submitting"` or `"result"` must not reset or lose
in-progress/result state (Edge Cases: "theme switch mid-submission").

### FaqViewState

Exists only in the browser tab's memory while the FAQ page is open. Backed by a static, in-code
list of FAQ entries (research.md decision 4) — not a fetched or persisted entity.

| Field | Type | Notes |
|---|---|---|
| searchTerm | string | filters visible questions by text match (FR-014) |
| openQuestionByCategory | `{ [category]: questionId \| null }` | at most one open question per category at a time (FR-016) |

**FaqEntry** (static content shape, not a runtime entity):

| Field | Type | Notes |
|---|---|---|
| id | string | stable identifier for open/close state |
| category | `Getting Started` \| `Account & Login` \| `Essay Scoring` | FR-013 |
| question | string | — |
| answer | string | the `Essay Scoring` category MUST include the official-score disclaimer (FR-015) |

### AuthGuardState (used by `ProtectedRoute.tsx`)

| Field | Type | Notes |
|---|---|---|
| status | `checking` \| `authenticated` \| `unauthenticated` | `checking` renders a loading state (research.md decision 1); `unauthenticated` redirects to `/signin` |

No state transitions table is needed for any of the above — all are simple, page-lifetime (or
`localStorage`-lifetime) view states, not persisted records with a lifecycle of their own.
