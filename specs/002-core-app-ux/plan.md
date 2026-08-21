# Implementation Plan: Core App UX — Landing, FAQ, Workspace & Profile

> **STALE — 2026-08-21.** Written against the retired FastAPI backend, the retired
> `003-account-authentication` HTTP contract, and the old four-surface scope (landing + FAQ +
> workspace + profile) built against the `stitch_writewise_ielts_editorial_saas` mockups.
> `spec.md` was rewritten and narrowed to the landing page alone, grounded in the real
> `writewise` Figma design. This file has not been regenerated yet — run `/speckit-plan` and
> `/speckit-tasks` to replace it. See [../README.md](../README.md).


**Branch**: `002-core-app-ux` | **Date**: 2026-08-20 (regenerated against the WriteWise/Stitch-design spec revision) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-core-app-ux/spec.md`

## Summary

A visitor lands on a marketing page (hero, problem/comparison, honest four-step how-it-works,
testimonials, pricing) that funnels into sign-up; a separate, searchable FAQ page handles
pre-purchase objections and carries the mandatory "not an official score" disclaimer; a signed-in
learner runs an essay assessment from a workspace that visualizes the result in place, in either
light or dark theme; and a profile page shows account details with sign-out.

Technical approach is unchanged from the prior planning pass in its core shape: this is a
**frontend-only** feature — no new backend endpoints, no new persisted data, no scoring logic. It
is the Next.js page layer composing `001-ielts-score-assessment`'s assessments API and
`003-account-authentication`'s auth API/client, now built against the approved
`stitch_writewise_ielts_editorial_saas` designs (product name **WriteWise**) instead of the
earlier `stitch_ielts_writing_diagnostic` mockup. Two things are new versus the prior plan: (1) a
dedicated `/faq` page and a display-only pricing section are in scope, and (2) the workspace must
support a light/dark theme toggle. The one non-obvious technical finding carried over unchanged:
because `003`'s refresh-token cookie is scoped to the backend's cross-origin domain
(`rexsantech.com`), Next.js edge middleware on Vercel cannot read it — route protection for
`/workspace` and `/profile` must be a client-side guard, not server-side middleware.

## Technical Context

**Language/Version**: TypeScript on the same Next.js (App Router) app established by `001`'s and
`003`'s plans — no new frontend project, and no backend code at all in this feature.

**Primary Dependencies**: Reused as-is: Next.js, React, Tailwind CSS (`001` research.md decision
8), `003`'s `frontend/src/lib/auth.ts` and `useAuth` hook, `001`'s `frontend/src/lib/apiClient.ts`.
New for this revision: Tailwind's `darkMode: "class"` strategy (already present, unused, in the
Stitch mockups' Tailwind config) plus a small client-side theme-persistence utility — no new
runtime dependency, `localStorage` + a `<html class="dark">` toggle is sufficient (see research.md
decision 5).

**Storage**: N/A — this feature persists nothing of its own; it renders data owned by `001`
(`EssaySubmission`/`AssessmentResult`) and `003` (`Account`). Theme preference persists only to
the browser's `localStorage`, not the backend.

**Testing**: Frontend only — component tests (Vitest) for the landing sections, FAQ search/filter
behavior, workspace states (empty/in-progress/result/error) in both themes, and profile view;
Playwright end-to-end tests for the full flows named in each user story (land → sign up →
workspace → submit → result; FAQ search; sign out; direct navigation to a protected route while
signed out; theme toggle persists across reload).

**Target Platform**: Vercel (this feature has no backend deployment surface).

**Project Type**: Web application — frontend-only slice of the existing `frontend/` + `backend/`
split.

**Performance Goals**: Landing and FAQ page content visible quickly on first load (standard web
expectation — no feature-specific number beyond spec SC-001/SC-006's usability checks). Workspace
round-trip latency is bounded by `001`'s own SC-001 (60s budget); this feature adds no additional
processing time. Theme toggle must apply instantly (no visible flash/repaint delay perceptible to
a user).

**Constraints**: Route protection for `/workspace` and `/profile` MUST be a client-side guard
(check `useAuth` state / call `GET /api/v1/auth/me` on mount, redirect if unauthenticated) rather
than Next.js middleware (research.md decision 1) — unchanged from the prior plan. New constraint
this revision: every workspace surface (editor, result panel, feedback tags, empty state) MUST
carry `dark:` variants — a component with only light-mode styling is not just visually incomplete,
it fails FR-018/SC-007 directly.

**Scale/Scope**: Same solo-maintained SaaS scale as `001`/`003` — no feature-specific scale
concerns; this is UI composition, not new infrastructure.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — see below.*

| Principle | Gate | Status |
|---|---|---|
| I. Rubric-Grounded, Explainable Scoring | N/A — this feature renders `001`'s already-grounded results, it does not produce scores | N/A |
| II. Teach-to-Improve Guidance | N/A | N/A |
| III. Test-First Development | Component and E2E tests written before implementation | PASS |
| IV. Evaluation-Driven Methodology Changes | N/A — no scoring methodology touched | N/A |
| V. Cost-Conscious LLM Usage | N/A — no LLM calls originate from this feature | N/A |
| VI. Simplicity & Reusable Design | No new backend surface; reuses `001`'s API client and `003`'s auth client/hook; FAQ search/filter and theme toggle are pure client-side UI state, no new abstraction layer | PASS |
| VII. Observability, Error Handling & Security by Default | Client-side auth guard prevents protected content from rendering before a session is confirmed; workspace surfaces `001`'s error states (rejection/failure) rather than swallowing them | PASS |

No violations — Complexity Tracking table omitted.

**Post-Phase-1 re-check**: The client-side route-guard decision (research.md decision 1), the
FAQ page being a standalone route rather than a landing-page anchor (research.md decision 6), and
the `localStorage`-only theme persistence (research.md decision 5) are the structural decisions
from this design pass. All are consistent with Principle VI (no new backend surface, no
speculative abstraction) and Principle VII (guard before render, no data leakage). No new
violations — all rows above still PASS/N/A.

## Project Structure

### Documentation (this feature)

```text
specs/002-core-app-ux/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── page-routes.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Frontend-only additions to the existing `frontend/` tree from `001`/`003`; no `backend/` changes.

```text
frontend/src/
├── app/
│   ├── page.tsx                  # NEW — landing page (hero, problem/comparison,
│   │                              # 4-step how-it-works, product-experience preview,
│   │                              # expert + learner testimonials, pricing display,
│   │                              # final CTA, footer), from marketing_landing_page_fresh_refresh
│   ├── faq/page.tsx              # NEW — dedicated FAQ page (search + 3 categorized,
│   │                              # single-open accordions), from frequently_asked_questions
│   ├── signup/page.tsx           # NEW — sign-up form, calls 003's signUp()
│   ├── signin/page.tsx           # NEW — sign-in form, calls 003's signIn()
│   ├── workspace/page.tsx        # NEW — 001 ships no UI of its own (backend-only, see its
│   │                              # plan.md); this is the only workspace page ever built,
│   │                              # ported from learner_workspace, theme-aware
│   └── profile/page.tsx          # NEW — view-only account details + sign-out
├── components/
│   ├── landing/                  # NEW — Hero, ProblemSection, ComparisonTable,
│   │                              # HowItWorksStep, ExpertReviewCard, LearnerReviewCard,
│   │                              # PricingCard, FinalCta
│   ├── faq/
│   │   ├── FaqSearch.tsx         # NEW — search input, filters visible questions (FR-014)
│   │   └── FaqAccordionCategory.tsx # NEW — single-open-per-category accordion (FR-016)
│   ├── workspace/
│   │   ├── EssayForm.tsx         # NEW — prompt/response inputs, task-type toggle, submit button
│   │   ├── EmptyState.tsx        # NEW — first-time guidance (FR-007)
│   │   ├── AssessmentResult.tsx  # NEW — band badge, 2×2 criteria grid with proportion
│   │   │                          # indicators, expandable line-by-line feedback (FR-005)
│   │   └── ThemeToggle.tsx       # NEW — light/dark switch scoped to the workspace (FR-018)
│   └── ProtectedRoute.tsx        # NEW — client-side auth guard wrapper (research.md decision 1)
├── lib/
│   └── theme.ts                  # NEW — read/write theme preference to localStorage,
│                                  # apply/remove `dark` class on <html> (research.md decision 5)
└── tests/
    ├── unit/                     # component tests
    └── e2e/                      # Playwright flows
```

**Structure Decision**: Purely additive to the existing frontend tree. The FAQ page is a first
-class route (`/faq`), not a landing-page section, matching the approved
`frequently_asked_questions` design being a standalone page rather than the prior spec revision's
in-page anchor. Pricing is a landing-page section only (no new route). Theme state lives in a
small `lib/theme.ts` utility rather than a state-management library, since it is a single boolean
persisted to `localStorage` — introducing a store for that would violate Principle VI.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
