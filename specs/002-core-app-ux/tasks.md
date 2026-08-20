---

description: "Task list for feature implementation"
---

# Tasks: Core App UX — Landing, FAQ, Workspace & Profile

**Input**: Design documents from `/specs/002-core-app-ux/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/page-routes.md](./contracts/page-routes.md), [quickstart.md](./quickstart.md)

**Tests**: Included — plan.md's Technical Context commits to component tests (Vitest) and E2E tests (Playwright) written before implementation, and Constitution Principle III (Test-First Development) is NON-NEGOTIABLE for application code.

**Organization**: Tasks are grouped by user story (per spec.md's priority order: US1 P1, US2 P1, US3 P2, US4 P2, US5 P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- File paths are exact, relative to repository root

## Path Conventions

Web app split established by `001-ielts-score-assessment` and `003-account-authentication`:
`backend/src/`, `frontend/src/`. This feature is **frontend-only** — no `backend/` paths appear
below (plan.md Summary; research.md decision 4).

**Dependency note**: This feature assumes `001`'s Setup phase (creates `frontend/` with Next.js,
TypeScript, Tailwind — see `001` tasks T001–T003) and `003`'s auth client (`frontend/src/lib/auth.ts`,
`useAuth` hook) already exist or are implemented alongside this feature. This feature's own Setup
phase does not recreate them.

---

## Phase 1: Setup

**Purpose**: Confirm the shared frontend scaffold this feature builds on is in place; nothing new to initialize.

- [X] T001 Verify `frontend/` (Next.js App Router + TypeScript + Tailwind, from `001` tasks T001–T003) and `003`'s `frontend/src/lib/auth.ts` / `useAuth` hook exist before starting; if either is missing, coordinate implementation order with `001`/`003` rather than duplicating scaffold here.

**Checkpoint**: Scaffold confirmed — foundational work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared building blocks every later user story phase depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create client-side auth guard component in `frontend/src/components/ProtectedRoute.tsx`, implementing the `checking`/`authenticated`/`unauthenticated` flow from [contracts/page-routes.md](./contracts/page-routes.md) (research.md decision 1) — used by US2's workspace and US3's profile page.
- [X] T003 [P] Create theme utility in `frontend/src/lib/theme.ts`: read/write a `light`/`dark` preference to `localStorage`, apply/remove a `dark` class on `<html>` (research.md decision 5) — used by US2's `ThemeToggle`.
- [X] T004 [P] Port the `academic_editorial` design tokens (colors, typography, border radius, spacing) and the `darkMode: "class"` strategy from the Stitch mockups' embedded Tailwind config into `frontend/tailwind.config.ts` — the canonical design system for every page in this feature (spec Assumptions; plan.md).
- [X] T005 [P] Load the Literata (display) and Geist (body/UI) fonts in the shared root layout `frontend/src/app/layout.tsx`.

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Discover the product and sign up (Priority: P1) 🎯 MVP

**Goal**: A visitor understands what WriteWise does, sees pricing, and can start creating an account from the landing page.

**Independent Test**: Load `/` as an unauthenticated visitor; verify the value proposition, problem/comparison content, and pricing are present, and sign-up completes and redirects to `/workspace`.

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T006 [P] [US1] Component test for `Hero` in `frontend/tests/unit/landing/Hero.test.tsx`
- [X] T007 [P] [US1] Component test for `ComparisonTable` in `frontend/tests/unit/landing/ComparisonTable.test.tsx`
- [X] T008 [P] [US1] Component test for `PricingCard` — four plans rendered, exactly one marked recommended, corrected figures (Free 1/day, Monthly $4.99, Yearly $49.9, Lifetime $99) — in `frontend/tests/unit/landing/PricingCard.test.tsx`
- [X] T009 [P] [US1] E2E test: visitor reads landing page, selects sign-up, completes the form, is redirected to `/workspace` in `frontend/tests/e2e/discover-and-signup.spec.ts`

### Implementation for User Story 1

- [X] T010 [P] [US1] Create `Hero` component in `frontend/src/components/landing/Hero.tsx`
- [X] T011 [P] [US1] Create `ProblemSection` component (three named frictions: slow feedback, vague comments, cost — FR-002) in `frontend/src/components/landing/ProblemSection.tsx`
- [X] T012 [P] [US1] Create `ComparisonTable` component (turnaround time, feedback detail, cost, availability — FR-002) in `frontend/src/components/landing/ComparisonTable.tsx`
- [X] T013 [P] [US1] Create `ExpertReviewCard` and `LearnerReviewCard` components in `frontend/src/components/landing/ExpertReviewCard.tsx` and `frontend/src/components/landing/LearnerReviewCard.tsx`
- [X] T014 [US1] Create `PricingCard` component with the corrected numbers, not the mockup's placeholders (research.md decision 7; FR-017) in `frontend/src/components/landing/PricingCard.tsx`
- [X] T015 [US1] Create `FinalCta` component in `frontend/src/components/landing/FinalCta.tsx`
- [X] T016 [US1] Assemble the landing page in `frontend/src/app/page.tsx`, composing `Hero`, `ProblemSection`, `ComparisonTable`, a product-experience preview, three `ExpertReviewCard`s, three `LearnerReviewCard`s, four `PricingCard`s, `FinalCta`, and footer, per `marketing_landing_page_fresh_refresh` (depends on T010–T015)
- [X] T017 [US1] Create the sign-up page in `frontend/src/app/signup/page.tsx`, calling `003`'s `signUp()`, redirecting to `/workspace` on success
- [X] T018 [US1] Create the sign-in page in `frontend/src/app/signin/page.tsx`, calling `003`'s `signIn()`, redirecting to `/workspace` on success, with both sign-up and sign-in CTAs reachable from the landing page header

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Run an assessment and see it visualized in the workspace (Priority: P1)

**Goal**: A signed-in learner submits an essay and sees the visualized result in the workspace, in either light or dark theme.

**Independent Test**: As a signed-in learner with no prior assessments, submit an essay from the workspace and verify the scored result renders in the same view, in both light and dark theme.

### Tests for User Story 2 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T019 [P] [US2] Component test for `EmptyState` in `frontend/tests/unit/workspace/EmptyState.test.tsx`
- [X] T020 [P] [US2] Component test for `EssayForm` in `frontend/tests/unit/workspace/EssayForm.test.tsx`
- [X] T021 [P] [US2] Component test for `AssessmentResult` — 2×2 criteria grid with proportion indicators, expandable line-by-line feedback — in `frontend/tests/unit/workspace/AssessmentResult.test.tsx`
- [X] T022 [P] [US2] Component test for `ThemeToggle` — persists to `localStorage`, applies/removes `dark` class — in `frontend/tests/unit/workspace/ThemeToggle.test.tsx`
- [X] T023 [P] [US2] E2E test: submit essay → in-progress → result; a rejected submission preserves essay text in the input in `frontend/tests/e2e/workspace-assessment.spec.ts`
- [X] T024 [P] [US2] E2E test: toggling theme mid-submission does not interrupt the in-flight request; theme choice persists across reload in `frontend/tests/e2e/workspace-theme.spec.ts`
- [X] T025 [P] [US2] E2E test: an unauthenticated visit to `/workspace` redirects to `/signin` in `frontend/tests/e2e/workspace-auth-guard.spec.ts`

### Implementation for User Story 2

- [X] T026 [US2] Create `EmptyState` component (first-time guidance — FR-007) in `frontend/src/components/workspace/EmptyState.tsx`
- [X] T027 [US2] Create `EssayForm` component (task-type toggle, prompt/essay inputs, submit) in `frontend/src/components/workspace/EssayForm.tsx`
- [X] T028 [US2] Create `AssessmentResult` component (band badge, 2×2 criteria grid with proportion indicators, expandable line-by-line feedback with category tag + correction/praise — FR-005) in `frontend/src/components/workspace/AssessmentResult.tsx`, calling `001`'s `POST /api/v1/assessments` via the existing API client
- [X] T029 [US2] Create `ThemeToggle` component in `frontend/src/components/workspace/ThemeToggle.tsx`, using `frontend/src/lib/theme.ts` (T003)
- [X] T030 [US2] Add `dark:` variants to `EmptyState`, `EssayForm`, `AssessmentResult`, and `ThemeToggle` so every workspace element is legible and correctly styled in both themes (FR-018, SC-007) (depends on T026–T029)
- [X] T031 [US2] Assemble the workspace page in `frontend/src/app/workspace/page.tsx`, wiring `WorkspaceViewState` (`idle` / `submitting` / `result` / `error`) per [data-model.md](./data-model.md), wrapped in `ProtectedRoute` (T002), per `learner_workspace`

**Checkpoint**: User Stories 1 AND 2 both work independently — this is the MVP.

---

## Phase 5: User Story 3 - Manage account from the profile page (Priority: P2)

**Goal**: A signed-in learner views their account details and can sign out from a profile page.

**Independent Test**: As a signed-in learner, open the profile page and verify account details display and sign-out works.

### Tests for User Story 3 ⚠️

- [X] T032 [P] [US3] Component test for `ProfileView` (display name, email) in `frontend/tests/unit/profile/ProfileView.test.tsx`
- [X] T033 [P] [US3] E2E test: view profile, sign out, redirected to `/`; subsequent visits to `/workspace` or `/profile` redirect to `/signin` in `frontend/tests/e2e/profile-signout.spec.ts`

### Implementation for User Story 3

- [X] T034 [US3] Create `ProfileView` component in `frontend/src/components/profile/ProfileView.tsx`, calling `003`'s `GET /api/v1/auth/me`
- [X] T035 [US3] Assemble the profile page in `frontend/src/app/profile/page.tsx`, wrapped in `ProtectedRoute` (T002), with sign-out calling `003`'s `POST /api/v1/auth/signout` and redirecting to `/`

**Checkpoint**: User Stories 1, 2, and 3 all work independently.

---

## Phase 6: User Story 4 - Find answers on the FAQ page (Priority: P2)

**Goal**: A visitor or learner searches or browses a dedicated FAQ page and finds a direct answer, including the official-score disclaimer.

**Independent Test**: Load `/faq` without an account, search for a term, and verify matching questions surface; confirm the "is the score official" disclaimer is present.

### Tests for User Story 4 ⚠️

- [X] T036 [P] [US4] Component test for `FaqSearch` (filters visible questions by text) in `frontend/tests/unit/faq/FaqSearch.test.tsx`
- [X] T037 [P] [US4] Component test for `FaqAccordionCategory` (one open question per category) in `frontend/tests/unit/faq/FaqAccordionCategory.test.tsx`
- [X] T038 [P] [US4] E2E test: search FAQ, no-match state, official-score disclaimer present in the Essay Scoring category, FAQ reachable from main navigation in `frontend/tests/e2e/faq.spec.ts`

### Implementation for User Story 4

- [X] T039 [P] [US4] Define the static FAQ content array (Getting Started, Account & Login, Essay Scoring categories, including the mandatory official-score disclaimer — FR-015) in `frontend/src/lib/faqData.ts`
- [X] T040 [US4] Create `FaqSearch` component in `frontend/src/components/faq/FaqSearch.tsx`
- [X] T041 [US4] Create `FaqAccordionCategory` component (single-open-per-category — FR-016) in `frontend/src/components/faq/FaqAccordionCategory.tsx`
- [X] T042 [US4] Assemble the FAQ page in `frontend/src/app/faq/page.tsx`, composing `FaqSearch` and three `FaqAccordionCategory` instances from `faqData.ts`, per `frequently_asked_questions` restyled to `academic_editorial` tokens (depends on T039–T041)
- [X] T043 [US4] Add a FAQ link to the shared site navigation (landing header/footer) (depends on T016)

**Checkpoint**: User Stories 1–4 all work independently.

---

## Phase 7: User Story 5 - Learn how scoring works before trusting it (Priority: P3)

**Goal**: A visitor reads the landing page's how-it-works content and understands, honestly, what's available today versus planned.

**Independent Test**: Load the landing page without an account and verify the four-step how-it-works section is present, with future steps honestly marked.

### Tests for User Story 5 ⚠️

- [X] T044 [P] [US5] Component test for `HowItWorksStep` — four steps rendered, future steps visually marked — in `frontend/tests/unit/landing/HowItWorksStep.test.tsx`
- [X] T045 [P] [US5] E2E test: how-it-works section shows all four steps (Submit, Get Scored, Learn the Fix, Track Trend) with the not-yet-built ones honestly marked in `frontend/tests/e2e/how-it-works.spec.ts`

### Implementation for User Story 5

- [X] T046 [US5] Create `HowItWorksStep` component (Submit, Get Scored, Learn the Fix\*, Track Trend\* — future steps marked, FR-003) in `frontend/src/components/landing/HowItWorksStep.tsx`
- [X] T047 [US5] Integrate the how-it-works section into the landing page in `frontend/src/app/page.tsx` (extends T016)

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verification that spans multiple user stories.

- [X] T048 [P] Run [quickstart.md](./quickstart.md) validation scenarios 1–5 manually against a local dev build
- [X] T049 [P] Accessibility pass: verify text contrast and visible keyboard focus states across all new pages, in both light and dark theme (SC-007)
- [X] T050 [P] Verify the "WriteWise" product name is applied consistently across page titles/metadata and footer copyright in `frontend/src/app/layout.tsx` and every new page

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — confirms prerequisites only.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–7)**: All depend on Foundational completion.
  - US1 and US2 (both P1) should be built first — together they are the MVP.
  - US3 and US4 (both P2) can follow, in either order.
  - US5 (P3) can follow last, or in parallel once Foundational is done.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories. Provides the `/signup`, `/signin` destinations US2/US3 land on after auth, but is independently testable on its own (a visitor can read the landing page and sign up without US2–US5 existing).
- **US2 (P1)**: No dependency on other stories; depends on `ProtectedRoute` (T002) and `theme.ts` (T003) from Foundational.
- **US3 (P2)**: No dependency on other stories; depends on `ProtectedRoute` (T002) from Foundational.
- **US4 (P2)**: No dependency on other stories; T043 (nav link) touches the landing page built in US1 but does not block US4's own page from being independently testable at `/faq` directly.
- **US5 (P3)**: Extends the landing page assembled in US1 (T016); independently testable as a landing-page section once US1's page shell exists.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Components before page assembly.
- Story complete before moving to the next priority (if working sequentially).

### Parallel Opportunities

- All Foundational tasks marked [P] (T002–T005) can run in parallel.
- Once Foundational completes, US1 and US2 (both P1) can be worked in parallel by different people.
- All tests for a user story marked [P] can run in parallel.
- All components within a story marked [P] can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Component test for Hero in frontend/tests/unit/landing/Hero.test.tsx"
Task: "Component test for ComparisonTable in frontend/tests/unit/landing/ComparisonTable.test.tsx"
Task: "Component test for PricingCard in frontend/tests/unit/landing/PricingCard.test.tsx"
Task: "E2E test discover-and-signup in frontend/tests/e2e/discover-and-signup.spec.ts"

# Launch independent components for User Story 1 together:
Task: "Create Hero component in frontend/src/components/landing/Hero.tsx"
Task: "Create ProblemSection component in frontend/src/components/landing/ProblemSection.tsx"
Task: "Create ComparisonTable component in frontend/src/components/landing/ComparisonTable.tsx"
Task: "Create ExpertReviewCard and LearnerReviewCard components in frontend/src/components/landing/"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Run quickstart.md Scenarios 1–2 independently
6. Deploy/demo if ready — this is the product's core loop (discover → sign up → get scored)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test independently → Demo (landing + sign-up works)
3. US2 → Test independently → Demo (MVP — the full core loop works)
4. US3 → Test independently → Demo (profile/sign-out)
5. US4 → Test independently → Demo (FAQ)
6. US5 → Test independently → Demo (how-it-works trust content)
7. Polish → Full quickstart.md validation, accessibility, naming consistency

### Parallel Team Strategy

With multiple developers, after Foundational is done:

- Developer A: US1 (landing + auth pages)
- Developer B: US2 (workspace + dark mode)
- Developer C: US3 + US4 (profile, FAQ)
- Developer D: US5 (how-it-works, once US1's page shell exists)

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Verify tests fail before implementing.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
- This feature adds zero backend endpoints or persisted entities (research.md decision 4) — every
  task above is frontend-only.

---

## Implementation notes (2026-08-20)

All 50 tasks complete. **126 component tests (Vitest) + 53 end-to-end tests (Playwright,
real Chromium) passing**, with `tsc --noEmit` and `eslint` clean.

Five things were built differently from the literal task text. Each is a deliberate
decision with a reason, recorded here so the difference is not mistaken for drift.

### 1. FR-005's "suggested correction" does not exist in `001`'s API — and was not invented

T028 and FR-005 ask the workspace for "expandable line-by-line feedback where each item
shows the quoted sentence, a category tag, and a suggested correction or a note of
praise". Checked against `backend/src/schemas/assessment.py`, `001` returns:

```
{ submission_id, overall_band, criteria[], created_at }
criteria[i] = { criterion, band, explanation, evidence_quotes[], descriptor_reference? }
```

Three of the four requested pieces are real and are rendered from live data — the quoted
sentence (`evidence_quotes`, verified verbatim server-side), the category tag
(`criterion`), and the reasoning (`explanation`). The fourth has no field: `001` scores
essays, it does not rewrite them.

Synthesising a correction in the browser would put teaching advice in front of a learner
that no model produced and no rubric grounds — the exact failure `001`'s evidence
anchoring exists to prevent. So the panel shows what the API can justify, and nothing
more. `AssessmentResult.test.tsx` asserts the absence explicitly, so a future change that
starts fabricating corrections fails the suite rather than shipping quietly.

The spec is internally consistent with this reading once you notice **FR-003 already
classes sentence-level corrections ("Learn the Fix") as a not-yet-built capability**. The
landing page marks that step "Coming soon" and the FAQ says the same. FR-005 and FR-003
contradicted each other; `001`'s contract settles it.

**Follow-up for whoever owns the spec**: FR-005 and quickstart Scenario 2 step 4 still
describe the correction UI. They should be reworded, or a scoped feature added to `001`
to produce corrections, before either is treated as unimplemented.

### 2. Semantic colour tokens instead of hand-written `dark:` variants (T004, T030)

T030 says to add `dark:` variants to each workspace component. Implemented instead as CSS
custom properties in `globals.css` that Tailwind reads (`tailwind.config.ts`), so `bg-surface`
resolves per theme automatically.

The requirement behind T030 is FR-018/SC-007: no element may be legible in only one
theme. Per-element `dark:` satisfies that only until someone forgets one — and the
forgotten one *is* the SC-007 failure. Tokens make a light-only component structurally
impossible. The `academic_editorial` design file specifies only a light palette; the dark
values were derived from the same Material-3 tonal palettes, keeping Muted Gold in its
"medal" role for scores in both themes.

### 3. Three FAQ answers contradict the mockup, because the mockup describes a product that does not exist

`frequently_asked_questions` was generated before the backend was built. Copying it would
have published three false statements:

| Mockup says | Reality | What ships |
|---|---|---|
| "Yes, WriteWise supports SSO with Google" | `003` is email + password only; OAuth deferred | "Not yet… on the roadmap" |
| "Click the Forgot Password link" | No reset endpoint exists (verified against the live OpenAPI document) | "Not built yet — contact support" |
| Generic "academic writing / research papers" | The product scores IELTS Writing Task 1 and Task 2 | Rewritten for IELTS |

This closes `/speckit-analyze` finding I3, which flagged the Google sign-in copy. The
"is the score official" answer was already correct in the mockup and is kept firm, with a
test asserting it opens with the word "No."

Landing-page testimonials are likewise labelled as placeholder copy rather than presented
as real quotes from named professionals.

### 4. E2E stubs `001`/`003` at the network boundary rather than running them

`playwright.config.ts` explains the reasoning. `001` and `003` already verify their own
APIs against a real Postgres and a real model; these specs exist to prove the page flows.
Booting a database and spending API credits to re-test another feature's contract would
make the suite slow and expensive without covering anything new. Stub payloads are copied
from the real schemas, so a contract change still surfaces.

### 5. Sign-out uses a full-page navigation (T035)

Found by the E2E suite, not by review: `router.replace("/")` after `signOut()` landed the
learner on `/signin`, not `/`. `signOut()` flips auth state while the page is still
mounted inside `ProtectedRoute`, whose effect fires first and wins the race — a direct
FR-009 violation. A hard navigation tears the tree down before the guard can react, and
also drops the in-memory access token, which is desirable for a sign-out regardless. This
required overriding a Next lint rule; the reason is recorded at the call site.

### Quickstart validation (T048)

Scenarios 1–5 are executed as Playwright specs against a production build in real
Chromium, rather than walked through by hand:

| Quickstart scenario | Spec |
|---|---|
| 1 — Discover and sign up | `tests/e2e/discover-and-signup.spec.ts` |
| 2 — Assessment + both themes | `workspace-assessment.spec.ts`, `workspace-theme.spec.ts`, `workspace-auth-guard.spec.ts` |
| 3 — Profile and sign out | `profile-signout.spec.ts` |
| 4 — FAQ | `faq.spec.ts` |
| 5 — How it works | `how-it-works.spec.ts` |

T049's accessibility pass is `tests/e2e/accessibility.spec.ts`: WCAG contrast measured on
every text node across all six pages in **both** themes, plus keyboard reachability and
focus visibility. It composites semi-transparent layers, because the design system uses
10%-opacity tints and treating them as opaque produces false failures.

### Not covered by this feature

`001`'s `GET /api/v1/assessments/{id}` is unused: FR-011 scopes the workspace to the
current assessment only, so nothing reloads a past one. The endpoint stays available for
the history/dashboard feature that FR-011 defers.
