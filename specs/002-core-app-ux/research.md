# Phase 0 Research: Core App UX (WriteWise revision)

> **STALE — 2026-08-21.** Written against the retired FastAPI backend, the retired
> `003-account-authentication` HTTP contract, and the old four-surface scope (landing + FAQ +
> workspace + profile) built against the `stitch_writewise_ielts_editorial_saas` mockups.
> `spec.md` was rewritten and narrowed to the landing page alone, grounded in the real
> `writewise` Figma design. This file has not been regenerated yet — run `/speckit-plan` and
> `/speckit-tasks` to replace it. See [../README.md](../README.md).


## 1. Route protection cannot use Next.js middleware

**Decision**: Protect `/workspace` and `/profile` with a client-side guard component
(`ProtectedRoute.tsx`) that checks `useAuth` state (and calls `GET /api/v1/auth/me` if state is
unknown on first load), redirecting to `/signin` when unauthenticated — not Next.js edge
middleware.

**Rationale**: `003-account-authentication` scoped the refresh-token cookie to the backend's own
domain (`rexsantech.com`, via cloudflared) because the access token is deliberately kept out of
any cookie (research.md decision 4 there). Next.js middleware runs on Vercel, a different origin
from the backend, and has no access to a cookie scoped to another domain. Middleware could at
best check for the *access* token, but that one is intentionally never persisted to a cookie
either (kept in memory). So the only place that can know "is this learner signed in" is client
JS, after it has loaded and either has an in-memory access token or has confirmed one via `/me`.

**Alternatives considered**: Move the refresh cookie to the frontend's own domain — rejected, was
already decided against in `003` for the same cross-origin reasons in the other direction. Proxy
all backend calls through a Next.js API route on the same origin, letting Vercel middleware see a
first-party cookie — a valid alternative, but a bigger architectural change than this UX feature
should make unilaterally to a decision `003` already finalized; noted as a future option if the
guard's brief loading flash becomes a real UX complaint.

## 2. `001` ships no UI — the workspace page is built exactly once, here

**Decision**: `frontend/src/app/workspace/page.tsx` is the only essay-submission/result page ever
built for this product. `001-ielts-score-assessment`'s plan originally sketched a placeholder
`frontend/src/app/assess/page.tsx`, but `/speckit-analyze` flagged (finding I1) that building it
there would have been discarded the moment this feature's real design landed — `001`'s tasks.md
was corrected to be backend-only (API + a thin `apiClient.ts`) before implementation began, so
there is no placeholder page to migrate away from. `001`'s `AssessmentResult` component (band,
criteria, explanations) is instead designed and built directly under `components/workspace/` here,
against `001`'s already-stable API contract.

**Rationale**: `001` was specified before this feature's UX design existed, and its own
quickstart validates the API entirely via direct calls (never a browser) — a placeholder UI was
never load-bearing for `001` to be considered done. Building the real workspace exactly once, here,
against the approved `learner_workspace` mockup avoids the wasted-work cycle a placeholder-then-
replace approach would have created.

**Alternatives considered**: Let `001` build a placeholder page and replace it here — rejected;
this is the specific duplication `/speckit-analyze` caught and `001`'s plan/tasks were corrected
to avoid.

## 3. Where sign-up/sign-in forms live

**Decision**: `/signup` and `/signin` pages are built in this feature, calling
`003`'s already-planned `frontend/src/lib/auth.ts` functions and `useAuth` hook.

**Rationale**: `003`'s research.md decision 7 explicitly drew this boundary: `003` owns the
authentication *capability* (API + token client), `002` owns the *pages*. This spec's own User
Story 1 (acceptance scenario 4) requires an actual account-creation destination to exist.

**Alternatives considered**: None — this was already agreed in `003`'s planning.

## 4. No new backend surface

**Decision**: This feature adds zero backend endpoints, models, or migrations. It consumes
`001`'s `POST /api/v1/assessments` / `GET /api/v1/assessments/{id}` and `003`'s
`/api/v1/auth/*` exactly as already contracted. The FAQ page and pricing section are static
content — no query, no admin-editable CMS, no new endpoint.

**Rationale**: Every capability this spec needs (submit essay, view result, sign up, sign in,
sign out, view account, browse FAQ, view pricing) either already has an owning feature and
contract, or is presentational-only content that doesn't warrant a backend surface at this scale.
Duplicating any existing capability here, or building a CMS for a handful of FAQ entries, would
violate Constitution Principle VI.

**Alternatives considered**: Model FAQ entries as backend-served data (so content could be edited
without a redeploy) — rejected for this MVP; the FAQ set is small and changes rarely enough that
a code-level content array is simpler (Principle VI), and this can be revisited if FAQ content
churn becomes a real maintenance burden.

## 5. Theme (light/dark) persistence

**Decision**: Workspace theme preference is stored client-side only, in `localStorage`
(`lib/theme.ts`), and applied by toggling a `dark` class on `<html>` (Tailwind's `darkMode:
"class"` strategy, already present but unused in the Stitch mockups' Tailwind config). No backend
call, no `Account` field.

**Rationale**: Spec FR-018 scopes dark mode to the workspace only, for the signed-in learner's own
device — there's no requirement for the preference to follow the learner across devices, so
persisting it server-side on `Account` (which would mean touching `003`'s data model for a
cosmetic preference) is unjustified complexity per Principle VI. `localStorage` is the standard,
zero-dependency mechanism for this exact case.

**Alternatives considered**: Persist theme on the `Account` entity via a new `003` field —
rejected as scope creep into another feature's data model for a preference with no stated
cross-device requirement. A dedicated state-management library (e.g. Zustand/Redux) for a single
boolean — rejected as unnecessary; React context + `localStorage` is sufficient.

## 6. FAQ is a standalone route, not a landing-page anchor

**Decision**: `/faq` is a first-class page (`frequently_asked_questions` mockup), separate from
the landing page, reachable via main navigation — not an in-page anchor section as an earlier
draft of this spec assumed.

**Rationale**: The approved design set built the FAQ as its own page with its own search and
category-accordion behavior (FR-013–016), which doesn't fit as a landing-page section without
either duplicating that interaction pattern inline or losing it. The landing page still carries
its own trust-building content (problem/comparison/how-it-works, User Story 5) — the FAQ page is
for deeper, specific-question lookup (User Story 4), a genuinely different job.

**Alternatives considered**: Keep FAQ as a landing-page `#faq` anchor with a simple list — rejected,
loses the search and disclaimer prominence the approved design gives it, and doesn't match the
mockup that exists.

## 7. Pricing section is presentational only, with corrected numbers

**Decision**: The landing page's pricing section renders four static plan cards (Free, Monthly,
Yearly — recommended, Lifetime) using the corrected figures from spec Assumptions (**Free — 1
essay/day, Monthly — $4.99, Yearly — $49.9, Lifetime — $99**), not the Stitch mockup's placeholder
numbers. No functional plan-selection, checkout, or entitlement logic — every plan's CTA routes to
`/signup` like the primary CTA does.

**Rationale**: Matches spec FR-017 ("display-only... checkout, payment processing, and plan
enforcement are not in scope") and the spec's explicit correction of the mockup's placeholder
pricing. Avoids building unused billing plumbing (Principle VI) while still shipping accurate,
non-misleading numbers to visitors.

**Alternatives considered**: Ship the mockup's placeholder numbers as-is and fix them later —
rejected; publishing incorrect prices to real visitors is a trust and (potentially) legal problem,
not a cosmetic one, so this is corrected at spec/plan time rather than deferred.

## 8. Admin dashboard's "Evaluation Runs"/"Learners"/etc. links are out of scope here

**Decision**: This feature does not build any admin-facing pages or links. The learner
workspace's sidebar in the mockup includes "Admin Center," which this plan treats as a mockup
artifact (per spec Assumptions) and does not implement.

**Rationale**: Consistent with `004-admin-dashboard` now existing as its own feature spec for the
operator-facing surface — building any part of it here would duplicate scope across two features
and blur the learner/operator persona boundary Principle VI's reusable-design intent implies.

**Alternatives considered**: None — this was already decided at the spec level.
