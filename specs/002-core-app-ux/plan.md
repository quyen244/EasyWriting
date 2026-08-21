# Implementation Plan: WriteWise Landing Page

**Branch**: `002-core-app-ux` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-core-app-ux/spec.md`

## Summary

An unauthenticated visitor reaches `/`, understands what WriteWise does, sees which of its two
skills (Writing, Speaking) is usable today, is given honest reasons to trust and pay for the
scoring, compares four pricing tiers, and can reach sign-up from anywhere on the page without a
dead end. The primary technical move is a **content and structure rewrite** of the existing
`frontend/src/components/landing/` tree (built against a retired spec and mockup set) against the
real `writewise` Figma design, adding the sections that design introduced (focus-area selector,
Why-WriteWise stats, FAQ teaser) and retiring the one that has no equivalent in it
(`ProblemSection`).

This feature owns no backend, no database, and no API — every entity is static, in-code content
(research.md, data-model.md). Its only real dependencies are on features that are Planned or
already Active but not yet deployed: the Supabase-platform auth feature (`/signup`/`/signin`'s
actual wiring) and `001-ielts-score-assessment` (the grader this page's copy must stay truthful
to). Neither dependency is implemented by this plan; both are named explicitly so "done" for this
feature doesn't quietly drift into claiming more than it delivers.

One product-scope question — whether General Training is in scope at all — is deliberately left
open by spec.md, with a named default this plan builds against (research.md R2). It is not this
plan's place to resolve it.

## Technical Context

**Language/Version**: TypeScript, React (Next.js 16 App Router) — the existing `frontend/` stack,
unchanged.

**Primary Dependencies**: None new. No `@supabase/supabase-js` call from this page (confirmed —
research.md R4); no new npm package.

**Storage**: None. All content is static TypeScript modules under `frontend/src/lib/`
(data-model.md).

**Testing**: Vitest + Testing Library (existing) for component-level tests; Playwright (existing)
for page-level flow, per research.md R7.

**Target Platform**: Web, deployed on Vercel — unchanged from the existing frontend.

**Project Type**: Frontend-only content/UI feature within the existing `frontend/` app. No new
top-level directory.

**Performance Goals**: Not a new concern this feature introduces — standard Next.js
static/SSR page performance. No new data fetching is added (everything is compiled-in content).

**Constraints**: Every factual/marketing claim on the page must remain true against
`001-ielts-score-assessment`'s actual shipped behavior (FR-008, FR-009, FR-011) and against
constitution TP-1's current scope (FR-009, FR-015, User Story 6 scenario 4) — this is a content
discipline constraint, not a technical one, but it is load-bearing enough to gate several tasks
(research.md R6's FAQ-answer rewrite; the stat-card wording review).

**Scale/Scope**: One route, ~10 rewritten/new components, three new content modules
(`navigation.ts`, `testimonials.ts`, `faqTeaser.ts`, `whyWriteWise.ts`), one rewritten
(`pricing.ts`). Same solo-maintained-SaaS scale as the rest of this project.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

| Principle | Gate | Status |
|---|---|---|
| I. Rubric-Grounded, Explainable Scoring | This page describes scoring, it doesn't perform it — FR-008/FR-011 require the description to stay accurate to `001`'s actual explainability, which is what keeps this page from independently violating Principle I by advertising more than the grader delivers | **PASS** |
| III. Test-First Development | Component tests exist per rewritten/new component (research.md R7); the `Plan`/`NavLink`/`Testimonial` validation rules in data-model.md are each stated as a testable, falsifiable proposition (exactly one recommended plan; no unavailable link renders as live; no General-Training testimonial while the flag is unresolved) | **PASS** |
| IV. Evaluation-Driven Methodology Changes | N/A — this feature makes no scoring-methodology change | **N/A** |
| V. Cost-Conscious LLM Usage | N/A — no LLM call from this page | **N/A** |
| VI. Simplicity & Reusable Design | Reuses existing component shape/Tailwind tokens where the design still fits them (research.md R1); one shared disabled-link pattern instead of four ad hoc ones (research.md R5); explicitly rejects building a throwaway auth stub or new visual-regression tooling this feature doesn't need (research.md R4, R7) | **PASS** |
| VII. Observability, Error Handling & Security by Default | No new data handling, no new auth/authz surface — this page reads and stores nothing. The one honesty-relevant control (FR-011, no overclaiming) is enforced by content review + the FaqTeaserItem unit test (data-model.md), not by RLS, because there is no database here to enforce it in | **PASS** |
| VIII. Database-Mediated Compute | This page calls no compute endpoint at all — it links toward `001`'s grader and the future Supabase-platform auth by page reference only, exactly the pattern Principle VIII requires of a page that isn't itself a compute client | **PASS** |

**Flagged, not a gate failure**: the General Training scope question (spec.md callout,
research.md R2) is a product decision explicitly deferred by the spec itself, with a stated
default this plan builds against. It is not an unjustified deviation from any principle — nothing
above requires resolving it before planning, and the default chosen (mark as "coming soon") is the
smaller, safer commitment either way the product owner ultimately decides.

No unjustified violations. **Complexity Tracking is empty.**

## Project Structure

### Documentation (this feature)

```text
specs/002-core-app-ux/
├── plan.md                  # This file
├── research.md              # Phase 0 — R1..R7
├── data-model.md            # Phase 1 — content shapes (no schema, no DB)
├── contracts/
│   └── page-routes.md       # Phase 1 — this feature's route + outbound dependencies
├── quickstart.md            # Phase 1 — validation guide per user story
└── tasks.md                 # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
frontend/src/
├── app/
│   └── page.tsx                          # REWRITTEN — new section order/composition
├── components/
│   ├── SiteHeader.tsx                     # REWRITTEN — General Training link, disabled-link pattern
│   ├── SiteFooter.tsx                     # REWRITTEN — real footer columns, disabled-link pattern
│   ├── ui/
│   │   └── DisabledLink.tsx               # NEW — shared "coming soon" treatment (research.md R5)
│   └── landing/
│       ├── Hero.tsx                       # REWRITTEN — real headline/CTA copy
│       ├── FocusAreaSelector.tsx          # NEW — Writing/Speaking cards (FR-004..FR-006)
│       ├── HowItWorksStep.tsx             # REWRITTEN — Analyze/Evaluate Criteria/Score & Improve
│       ├── WhyWriteWiseStats.tsx          # NEW — 4 stat cards (FR-009)
│       ├── ComparisonTable.tsx            # REWRITTEN — 3-column real comparison (FR-010)
│       ├── PricingCard.tsx                # REWRITTEN — reads the new Plan shape
│       ├── TestimonialCard.tsx            # NEW — replaces ExpertReviewCard + LearnerReviewCard
│       ├── FaqTeaser.tsx                  # NEW — 3-item inline accordion (FR-020)
│       └── FinalCta.tsx                   # REWRITTEN — real copy
│       # ProblemSection.tsx and ExpertReviewCard.tsx/LearnerReviewCard.tsx REMOVED (research.md R1)
└── lib/
    ├── pricing.ts                         # REWRITTEN — 4 real tiers, speakingIncluded flag
    ├── navigation.ts                      # NEW — NavLink/FooterLink shape (data-model.md)
    ├── testimonials.ts                    # NEW
    ├── faqTeaser.ts                       # NEW — adapted from faqData.ts per research.md R6
    ├── whyWriteWise.ts                    # NEW
    └── faqData.ts                         # UNCHANGED — backs the separate, out-of-scope /faq page

frontend/tests/
├── unit/landing/
│   ├── Hero.test.tsx                      # REWRITTEN
│   ├── FocusAreaSelector.test.tsx         # NEW
│   ├── HowItWorksStep.test.tsx            # REWRITTEN
│   ├── WhyWriteWiseStats.test.tsx         # NEW
│   ├── ComparisonTable.test.tsx           # REWRITTEN
│   ├── PricingCard.test.tsx               # REWRITTEN
│   ├── TestimonialCard.test.tsx           # NEW
│   └── FaqTeaser.test.tsx                 # NEW
└── e2e/
    ├── how-it-works.spec.ts               # REWRITTEN — new copy/structure
    └── landing-page.spec.ts               # NEW — full-page flow per quickstart.md
    # discover-and-signup.spec.ts, profile-signout.spec.ts UNCHANGED (research.md R4/R7)
```

**Structure Decision**: No new top-level directory — this feature lives entirely inside the
existing `frontend/` app, per constitution's fixed frontend stack. The dividing line between
"rewritten" and "new" follows research.md R1: keep a file where the new design still has an
equivalent section/shape, add a new one where it doesn't, and remove the one component
(`ProblemSection.tsx`) with no equivalent left after the redesign. `lib/faqData.ts` is explicitly
left unchanged — it backs a different page (`/faq`) that this feature does not own.

## Complexity Tracking

*No entries — Constitution Check above passed without requiring a deviation.*

---

## Post-Design Constitution Re-Check

Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md):

- **III (Test-First)**: data-model.md's validation rules (exactly one recommended plan, no
  unavailable link rendered live, no unresolved-track testimonial, no verbatim-quote overclaim in
  the FAQ teaser) are each concrete enough now to write a failing test against directly. **Still
  PASS.**
- **VI (Simplicity)**: contracts/page-routes.md confirms this feature still introduces zero new
  compute surface and zero new dependency — the disabled-link pattern (research.md R5) remains
  the only shared abstraction this design required. **Still PASS.**
- **VIII (Database-Mediated Compute)**: contracts/page-routes.md's "What this feature does NOT
  expose" section confirms no API route, server action, or database access was introduced during
  design. **Still PASS.**

No new violations surfaced during design. Ready for `/speckit-tasks`.
