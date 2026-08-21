<!-- STALE 2026-08-21 -- describes the retired 003 auth HTTP contract and the four-surface
     scope. spec.md now covers the landing page ('/') only; its Functional Requirements are
     the current source of truth for that route. -->
# Page Routes Contract: Core App UX (WriteWise revision)

This feature adds no HTTP API — its "contract" is which pages exist, who can reach them, and
which existing APIs (from `001` and `003`) each one depends on. This is the UI contract format
appropriate for a frontend-only feature (per plan.md Phase 1 guidance).

| Route | Access | Depends on | Notes |
|---|---|---|---|
| `/` | Public | none | Landing page — hero, problem/comparison (FR-002), 4-step how-it-works (FR-003), product-experience preview, expert + learner testimonials, pricing display (FR-017, display-only), final CTA, footer |
| `/faq` | Public | none | Standalone FAQ page — search (FR-014), 3 categorized single-open accordions (FR-013, FR-016), mandatory official-score disclaimer in Essay Scoring category (FR-015) |
| `/signup` | Public | `003` `POST /api/v1/auth/signup` | On success, store access token via `useAuth`, redirect to `/workspace` |
| `/signin` | Public | `003` `POST /api/v1/auth/signin` | Same redirect behavior as `/signup` |
| `/workspace` | **Protected** (`ProtectedRoute`) | `001` `POST /api/v1/assessments` | Empty state (FR-007) → submitting (FR-006) → result or error (FR-005, User Story 2 acceptance scenario 3); theme-toggle available (FR-018) |
| `/profile` | **Protected** (`ProtectedRoute`) | `003` `GET /api/v1/auth/me`, `003` `POST /api/v1/auth/signout` | View-only (FR-012); sign-out redirects to `/` (FR-009) |

## Protected route behavior (research.md decision 1)

```
On mount:
  if useAuth state == "authenticated" → render page immediately
  else if state == "unknown" → show loading state, call GET /api/v1/auth/me
    → 200 → set "authenticated", render page
    → 401 → set "unauthenticated", redirect to /signin
  else (already "unauthenticated") → redirect to /signin
```

This satisfies spec FR-004 and FR-010 (redirect unauthenticated visitors; no reachable protected
content after sign-out) and SC-004 (no broken/partially-loaded page — the loading state is shown
instead of protected content until the check resolves).

## Theme behavior (research.md decision 5)

```
On workspace mount:
  read localStorage theme preference (default "light")
  apply/remove `dark` class on <html> accordingly
On toggle:
  flip preference, persist to localStorage, apply/remove `dark` class
  — does not alter WorkspaceViewState.status or any in-flight submission
```

This satisfies FR-018 and SC-007 (all workspace elements legible/correctly styled in both themes,
independent of submission state).
