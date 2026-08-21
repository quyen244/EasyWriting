# Tasks: WriteWise Landing Page

**Input**: Design documents from `/specs/002-core-app-ux/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/page-routes.md](./contracts/page-routes.md), [quickstart.md](./quickstart.md)

**Tests**: **Required, not optional.** Constitution Principle III (NON-NEGOTIABLE) mandates
red-green-refactor. `plan.md`'s Constitution Check already commits every rewritten/new component
to a test stating its data-model.md validation rule as a falsifiable proposition. Each test task
below MUST be written and confirmed failing before its paired implementation task.

**Organization**: Grouped by user story from spec.md (US1–US6), preceded by Setup and
Foundational phases. Priorities: US1/US2/US3 (P1), US4/US5 (P2), US6 (P3).

**No backend, no API, no database, no deployment step.** This feature is entirely inside
`frontend/`, already deployed via the existing Vercel pipeline — nothing here needs the
"ask before touching the live project" gate that `001`'s tasks.md carries; there is no live
project surface this feature touches.

## Path Conventions

Per plan.md's Project Structure:

- `frontend/src/app/page.tsx` — composition
- `frontend/src/components/{SiteHeader,SiteFooter}.tsx`, `frontend/src/components/ui/`,
  `frontend/src/components/landing/*`
- `frontend/src/lib/*` — static content modules
- `frontend/tests/unit/landing/*`, `frontend/tests/e2e/*`

---

## Phase 1: Setup

**Purpose**: Clear away what the redesign has no equivalent for, so nothing later accidentally
builds on top of retired content.

- [ ] T001 [P] Remove `frontend/src/components/landing/ProblemSection.tsx` — no equivalent
      section in the `writewise` design (research.md R1)
- [ ] T002 [P] Remove `frontend/src/components/landing/ExpertReviewCard.tsx` and
      `frontend/src/components/landing/LearnerReviewCard.tsx` — replaced by one `TestimonialCard`
      shape (research.md R1); confirmed no dedicated test files exist for either, so no orphaned
      test to remove alongside them
- [ ] T003 Remove the now-dangling imports/usages of the three components above from
      `frontend/src/app/page.tsx` (full rewrite happens in US1, but this keeps the tree buildable
      in between)

**Checkpoint**: The tree builds with the retired content gone; nothing later re-imports it by
accident.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared nav/footer shell and the static content shapes every user story's section
renders from. No section is independently testable before its content module and the shared
disabled-link treatment exist.

### Shared disabled-link pattern (research.md R5 — used by US2, US3's footer-adjacent claims, US5, US6)

- [ ] T004 [P] Write `frontend/tests/unit/ui/DisabledLink.test.tsx` asserting: renders with
      `aria-disabled="true"` and a visible "Coming soon" marker when `available: false`; renders
      as a normal navigable link when `available: true`. Confirm it fails (red) —
      `DisabledLink.tsx` doesn't exist yet.
- [ ] T005 [P] Implement `frontend/src/components/ui/DisabledLink.tsx` — makes T004 pass

### Static content shapes (data-model.md — each a testable, falsifiable shape per Principle III)

- [ ] T006 [P] Write `frontend/tests/unit/lib/pricing.test.ts` asserting: exactly 4 plans; exactly
      1 has `recommended: true`; the Free plan's `features` describe an actual scored result, not
      preview/demo wording (FR-014); `speakingIncluded` is `true` only for Yearly and Lifetime
      (FR-015). Confirm it fails (red).
- [ ] T007 [P] Rewrite `frontend/src/lib/pricing.ts` to the real four tiers (`$0` / `$4.99` /
      `$49.9` / `$149.9`, badges `START HERE`/`POPULAR`/`RECOMMENDED`/`PAY ONCE`, `speakingIncluded`
      flag), with a file-level comment flagging the Yearly/Lifetime figures as
      as-designed-pending-confirmation (research.md R3) — makes T006 pass
- [ ] T008 [P] Write `frontend/tests/unit/lib/navigation.test.ts` asserting: every entry with
      `available: true` has a non-empty `href`; the Speaking-adjacent and (pending the General
      Training decision) General Training entries default to `available: false` (FR-006, FR-018,
      FR-019). Confirm it fails (red).
- [ ] T009 [P] Create `frontend/src/lib/navigation.ts` — `NavLink`/`FooterLink` shape and content
      for the primary nav, footer columns (Product/Resources/Company), and the stub-destination
      entries (Blog, Practice Tests, Band Calculators, About Us, Contact, Privacy Policy) — makes
      T008 pass
- [ ] T010 [P] Write `frontend/tests/unit/lib/testimonials.test.ts` asserting: at least 3 entries;
      each `quote` names a specific improvement rather than generic praise (FR-017); no
      `track: "General Training"` entry is included while the flagged decision remains unresolved
      (FR-018, data-model.md). Confirm it fails (red).
- [ ] T011 [P] Create `frontend/src/lib/testimonials.ts` — makes T010 pass
- [ ] T012 [P] Write `frontend/tests/unit/lib/faqTeaser.test.ts` asserting: exactly 3 items; the
      explainability answer's text does not contain "verbatim" or "exact quote" (research.md R6,
      data-model.md). Confirm it fails (red).
- [ ] T013 [P] Create `frontend/src/lib/faqTeaser.ts` — first two answers adapted from
      `frontend/src/lib/faqData.ts`'s `"accuracy"` and `"task-types"` entries, third written fresh
      against `001-ielts-score-assessment`'s current FR-013..FR-016 (research.md R6) — makes T012
      pass
- [ ] T014 [P] Write `frontend/tests/unit/lib/whyWriteWise.test.ts` asserting: exactly 4 stat
      cards; no caption reads as a guaranteed individual outcome (FR-009 — checked as a
      string-pattern discipline, e.g. rejecting first-person guarantee phrasing). Confirm it fails
      (red).
- [ ] T015 [P] Create `frontend/src/lib/whyWriteWise.ts` — the four cards
      (`+1.5`/`100+`/`<1 min`/`5.0+`) — makes T014 pass

### Persistent shell (renders on every story regardless of scroll position)

- [ ] T016 [P] Write `frontend/tests/unit/SiteHeader.test.tsx` asserting: WriteWise mark present;
      "Login" and "Join now" both rendered (FR-003); the General-Training-pending link uses
      `DisabledLink` per its current `available` value (FR-018). Confirm it fails (red).
- [ ] T017 Rewrite `frontend/src/components/SiteHeader.tsx` against `lib/navigation.ts` and
      `ui/DisabledLink.tsx` — makes T016 pass (depends on T005, T009)
- [ ] T018 [P] Write `frontend/tests/unit/SiteFooter.test.tsx` asserting: WriteWise mark, tagline,
      three link columns, copyright line all present (FR-022); every footer entry with
      `available: false` renders via `DisabledLink`, never as a plain dead link (FR-019). Confirm
      it fails (red).
- [ ] T019 Rewrite `frontend/src/components/SiteFooter.tsx` against `lib/navigation.ts` — makes
      T018 pass (depends on T005, T009)

**Checkpoint**: Shared shell and every content shape exist and are independently proven. Each user
story below is now section-by-section composition + its own test, not shape design.

---

## Phase 3: User Story 1 - Understand the pitch and start for free (Priority: P1) 🎯 MVP

**Goal**: A visitor reads the hero, understands the product, and can reach sign-up from the hero
or the final CTA band.

**Independent Test**: Load `/` with only Hero + FinalCta composed (this story's scope); verify
SC-001/SC-002 hold without any other section existing yet.

### Tests for User Story 1 ⚠️ Write first, confirm they fail

- [ ] T020 [P] [US1] Write `frontend/tests/unit/landing/Hero.test.tsx` asserting: headline and
      supporting line render without requiring interaction (FR-001); "Get started for free" and
      "How it works" both present (FR-002); "How it works" links to `#how-it-works`, not a full
      navigation
- [ ] T021 [P] [US1] Write `frontend/tests/unit/landing/FinalCta.test.tsx` asserting: a sign-up
      action equivalent to the hero's primary action is present (FR-021)
- [ ] T022 [P] [US1] Add a landing-page flow case to `frontend/tests/e2e/landing-page.spec.ts`
      (new file, shared across US1–US6): load `/`, assert the hero is visible without scrolling
      and a sign-up link is reachable at both the top and bottom of the page (SC-001, SC-002)

### Implementation for User Story 1

- [ ] T023 [US1] Rewrite `frontend/src/components/landing/Hero.tsx` with the real headline
      ("Master your IELTS Writing with AI-powered feedback"), supporting line, and dual CTA — makes
      T020 pass
- [ ] T024 [US1] Rewrite `frontend/src/components/landing/FinalCta.tsx` with the real closing copy
      ("Ready to turn your next essay into a higher band score?") — makes T021 pass
- [ ] T025 [US1] Rewrite `frontend/src/app/page.tsx`'s composition root: `SiteHeader` + `Hero` +
      (placeholder anchors for sections added in later phases) + `FinalCta` + `SiteFooter` — the
      minimal composable skeleton every later story's task appends a section into (depends on
      T017, T019, T023, T024)
- [ ] T026 [US1] Run `npm test` and `npm run test:e2e` and confirm T020–T022 pass (green)

**Checkpoint**: User Story 1 is fully functional and independently testable — the MVP: a visitor
can understand the pitch and reach sign-up.

---

## Phase 4: User Story 2 - Choose a focus area honestly (Priority: P1)

**Goal**: A visitor sees Writing (usable) and Speaking (coming soon) and cannot mistake one for
the other.

**Independent Test**: With US1's skeleton in place, add the focus-area section; verify Speaking's
"coming soon" marker is unmistakable and its interaction never implies a working assessment.

### Tests for User Story 2 ⚠️ Write first, confirm they fail

- [ ] T027 [P] [US2] Write `frontend/tests/unit/landing/FocusAreaSelector.test.tsx` asserting:
      exactly two cards (FR-004); Writing's action leads toward the grader
      (`001-ielts-score-assessment`'s entry point, not a placeholder — FR-005); Speaking renders
      via `DisabledLink`/an equivalent inert control and is visibly marked "Coming soon" (FR-006)
- [ ] T028 [P] [US2] Add a focus-area case to `frontend/tests/e2e/landing-page.spec.ts`: click the
      Speaking card; assert no navigation to a live assessment occurs (US2 scenario 4)

### Implementation for User Story 2

- [ ] T029 [US2] Create `frontend/src/components/landing/FocusAreaSelector.tsx` — two cards,
      Writing wired to the grader entry point, Speaking wired through `DisabledLink` — makes T027
      pass (depends on T005)
- [ ] T030 [US2] Insert `FocusAreaSelector` into `frontend/src/app/page.tsx`'s composition,
      immediately after `Hero` per the design's section order (depends on T025, T029)
- [ ] T031 [US2] Run `npm test` and `npm run test:e2e` and confirm T027–T028 pass (green)

**Checkpoint**: US1 + US2 — a visitor understands the pitch and cannot be misled about Speaking.

---

## Phase 5: User Story 3 - Trust the scoring and understand how it works (Priority: P1)

**Goal**: How-It-Works, Why-WriteWise stats, and the Comparison table all stay truthful to
`001-ielts-score-assessment`'s actual behavior.

**Independent Test**: With US1+US2 composed, add these three sections; cross-check every claim
against `001`'s spec directly (quickstart.md User Story 3).

### Tests for User Story 3 ⚠️ Write first, confirm they fail

- [ ] T032 [P] [US3] Write `frontend/tests/unit/landing/HowItWorksStep.test.tsx` asserting:
      exactly 3 steps (Analyze, Evaluate Criteria, Score & Improve — FR-007); the Evaluate
      Criteria step's description names all four official criteria by
      `001-ielts-score-assessment`'s exact criterion labels (FR-008)
- [ ] T033 [P] [US3] Write `frontend/tests/unit/landing/WhyWriteWiseStats.test.tsx` asserting:
      exactly 4 cards; no caption reads as a promised individual outcome (FR-009)
- [ ] T034 [P] [US3] Write `frontend/tests/unit/landing/ComparisonTable.test.tsx` (rewritten)
      asserting: three columns (Traditional Teacher, Other AI Tools, WriteWise); WriteWise is
      visibly marked as the recommended choice; every WriteWise-column claim is one
      `001-ielts-score-assessment`'s current spec actually backs (FR-010, FR-011)

### Implementation for User Story 3

- [ ] T035 [P] [US3] Rewrite `frontend/src/components/landing/HowItWorksStep.tsx` with the real
      3-step content — makes T032 pass
- [ ] T036 [P] [US3] Create `frontend/src/components/landing/WhyWriteWiseStats.tsx` reading
      `lib/whyWriteWise.ts` — makes T033 pass (depends on T015)
- [ ] T037 [P] [US3] Rewrite `frontend/src/components/landing/ComparisonTable.tsx` with the real
      3-column content (Traditional Teacher: 2-5 days / $20-50 per essay / subjective;
      Other AI Tools: generic checks / not IELTS-aligned / inaccurate bands; WriteWise: affordable
      subscription / objective scoring / grammar & vocab fixes, "Best choice" marker) — makes T034
      pass
- [ ] T038 [US3] Insert `HowItWorksStep`'s section, `WhyWriteWiseStats`, and `ComparisonTable` into
      `frontend/src/app/page.tsx`'s composition in the design's real order — How It Works → Why
      WriteWise → Comparison (depends on T030, T035, T036, T037)
- [ ] T039 [US3] Run `npm test` and confirm T032–T034 pass (green)

**Checkpoint**: US1+US2+US3 — every credibility claim on the page is checked against what `001`
actually ships, not assumed.

---

## Phase 6: User Story 4 - Compare pricing and choose a plan (Priority: P2)

**Goal**: Four pricing tiers, one recommended, Speaking's future-entitlement status clear, plan
identity carried into sign-up.

**Independent Test**: With US1–US3 composed, add pricing; verify quickstart.md User Story 4's five
scenarios directly.

### Tests for User Story 4 ⚠️ Write first, confirm they fail

- [ ] T040 [P] [US4] Write `frontend/tests/unit/landing/PricingCard.test.tsx` (rewritten)
      asserting: renders `lib/pricing.ts`'s four plans; the recommended plan is visibly marked
      (FR-013); a plan with `speakingIncluded: true` shows the not-yet-usable qualifier next to
      that feature line, not just in the data (FR-015); the CTA `href` carries the plan identity
      (e.g. `/signup?plan=yearly` — FR-016)
- [ ] T041 [P] [US4] Add a pricing case to `frontend/tests/e2e/landing-page.spec.ts`: click each
      plan's CTA; assert the resulting URL/query carries that plan's identity (FR-016)

### Implementation for User Story 4

- [ ] T042 [US4] Rewrite `frontend/src/components/landing/PricingCard.tsx` against the rewritten
      `lib/pricing.ts` (T007) — makes T040 pass
- [ ] T043 [US4] Insert the pricing section into `frontend/src/app/page.tsx`'s composition,
      immediately after Comparison per the design's order (depends on T038, T042)
- [ ] T044 [US4] Run `npm test` and `npm run test:e2e` and confirm T040–T041 pass (green)

**Checkpoint**: US1–US4 — a visitor can compare, choose, and carry their choice into sign-up.

---

## Phase 7: User Story 5 - See evidence real learners improved (Priority: P2)

**Goal**: At least three specific, non-generic testimonials; no unresolved-track testimonial
rendered.

**Independent Test**: With US1–US4 composed, add testimonials; verify quickstart.md User Story 5.

### Tests for User Story 5 ⚠️ Write first, confirm they fail

- [ ] T045 [P] [US5] Write `frontend/tests/unit/landing/TestimonialCard.test.tsx` asserting: a
      single card shape renders name, track, and quote (replacing the old expert/learner split —
      research.md R1); no card renders for a `track: "General Training"` entry unless the flagged
      decision has resolved in favour of it (FR-018)

### Implementation for User Story 5

- [ ] T046 [US5] Create `frontend/src/components/landing/TestimonialCard.tsx` reading
      `lib/testimonials.ts` — makes T045 pass (depends on T011)
- [ ] T047 [US5] Insert the testimonials section into `frontend/src/app/page.tsx`'s composition,
      immediately after Pricing per the design's order (depends on T043, T046)
- [ ] T048 [US5] Run `npm test` and confirm T045 passes (green)

**Checkpoint**: US1–US5 — social proof is present and scope-honest.

---

## Phase 8: User Story 6 - Get quick answers without leaving the page (Priority: P3)

**Goal**: A 3-item inline FAQ accordion, independently expandable, honest about task coverage and
explainability.

**Independent Test**: With US1–US5 composed, add the FAQ teaser; verify quickstart.md User Story
6's four scenarios, including the no-verbatim-overclaim check (research.md R6).

### Tests for User Story 6 ⚠️ Write first, confirm they fail

- [ ] T049 [P] [US6] Write `frontend/tests/unit/landing/FaqTeaser.test.tsx` asserting: exactly 3
      items (FR-020); expanding one does not affect the other two's collapsed state; no navigation
      occurs on expand/collapse
- [ ] T050 [P] [US6] Add a FAQ-teaser case to `frontend/tests/e2e/landing-page.spec.ts`: expand
      each of the three items independently; assert the URL never changes

### Implementation for User Story 6

- [ ] T051 [US6] Create `frontend/src/components/landing/FaqTeaser.tsx` reading
      `lib/faqTeaser.ts` — makes T049 pass (depends on T013)
- [ ] T052 [US6] Insert the FAQ teaser into `frontend/src/app/page.tsx`'s composition, immediately
      before `FinalCta` per the design's order (depends on T047, T051)
- [ ] T053 [US6] Run `npm test` and `npm run test:e2e` and confirm T049–T050 pass (green)

**Checkpoint**: All six user stories independently functional and testable — the full page.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: The two audits spec.md's Success Criteria name explicitly, plus the existing-suite
regression check.

- [ ] T054 [P] Link audit (SC-005): enumerate every nav/footer entry from `lib/navigation.ts`;
      assert each either resolves to a real route already in `frontend/src/app/` or renders with
      `available: false` — zero silent dead ends
- [ ] T055 [P] Reduced-motion check (Edge Cases): with `prefers-reduced-motion` simulated, assert
      the hero's core content and every section's text remain fully readable with no animation
- [ ] T056 Update `frontend/tests/e2e/how-it-works.spec.ts` for the new copy/structure (it
      currently asserts against the retired content — research.md R7)
- [ ] T057 Confirm `frontend/tests/e2e/discover-and-signup.spec.ts` and `profile-signout.spec.ts`
      are left unmodified, per research.md R4/R7 — their auth-contract stubs are the
      Supabase-platform feature's concern, not this one's; this task is a check, not a change
- [ ] T058 Run the full `npm test` + `npm run test:e2e` suite together as a final regression pass
- [ ] T059 Run quickstart.md end-to-end in a dev server (`npm run dev`) and confirm every
      Acceptance Scenario in spec.md §User Scenarios passes, including the stated known limitation
      (research.md R4 — `/signup`/`/signin` reachable but not yet functional)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T003 leaves `page.tsx` in a buildable state for
  T025 to rewrite). **Blocks all user stories** — every story's component reads a `lib/*` shape or
  renders inside `SiteHeader`/`SiteFooter`.
- **User Stories (Phase 3–8)**: Each depends on Foundational, and **each depends on the previous
  story's `page.tsx` composition task** (T025 → T030 → T038 → T043 → T047 → T052) because they
  share one file being assembled incrementally in the design's real section order — this is the
  one place these stories are not fully parallel, unlike a typical multi-route feature. Component
  and test authorship *within* each story has no such dependency and can proceed in parallel with
  other stories' component authorship.
- **Polish (Phase 9)**: Depends on all six user stories being composed.

### Within Each Phase

- Tests MUST be written and confirmed failing before their paired implementation task
  (Principle III) — every phase above is ordered that way already.
- The five `lib/*.ts` content modules (Foundational) have no dependencies on each other and can
  be authored in parallel; `DisabledLink` similarly.

### Parallel Opportunities

- **Setup**: T001, T002 — different files.
- **Foundational**: T004/T006/T008/T010/T012/T014 (five independent content-shape test files) and
  T016/T018 (shell tests) — six independent lanes, all startable together. Their implementations
  (T005, T007, T009, T011, T013, T015) are similarly independent of each other, though T017/T019
  each depend on their own shell test plus `DisabledLink`+`navigation.ts`.
- **Within a user story**: test-writing tasks marked `[P]` (e.g. T032/T033/T034 in US3) are
  independent files and can be written together; their paired implementations are equally
  independent of each other, though all funnel into the same shared `page.tsx` composition task
  for that story.

---

## Parallel Example: Foundational Phase

```bash
# Six independent lanes, all startable together once Setup (Phase 1) is done:
Task: "Write frontend/tests/unit/ui/DisabledLink.test.tsx — T004"
Task: "Write frontend/tests/unit/lib/pricing.test.ts — T006"
Task: "Write frontend/tests/unit/lib/navigation.test.ts — T008"
Task: "Write frontend/tests/unit/lib/testimonials.test.ts — T010"
Task: "Write frontend/tests/unit/lib/faqTeaser.test.ts — T012"
Task: "Write frontend/tests/unit/lib/whyWriteWise.test.ts — T014"

# Each lane's implementation follows once its own test fails as expected:
Task: "Implement frontend/src/components/ui/DisabledLink.tsx — T005 (after T004 fails)"
Task: "Rewrite frontend/src/lib/pricing.ts — T007 (after T006 fails)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational) — the shared shell and every content shape
   are non-negotiable prerequisites regardless of which story ships first.
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: run T020–T022 and quickstart.md's User Story 1 section in a dev server.
4. This is a demonstrable landing page — hero, pitch, reachable sign-up — even before the
   focus-area, credibility, pricing, testimonial, or FAQ sections exist.

### Incremental Delivery

1. Setup + Foundational → shell and content shapes proven.
2. US1 → the pitch and a reachable CTA → demo-able MVP.
3. US2 → Speaking's roadmap status stops being ambiguous.
4. US3 → the credibility arc is checked against what `001` actually ships, not assumed.
5. US4 → pricing is complete and the Speaking-gating is explicit.
6. US5 → social proof, scope-honest about General Training.
7. US6 → the FAQ teaser closes with the same honesty discipline the rest of the page carries.
8. Polish → the link audit and reduced-motion check are the gate before calling this page done,
   not an afterthought.

### What is deliberately NOT in this task list

Fixing `/signup`/`/signin`'s actual auth wiring, building the standalone `/faq` page, or resolving
the General Training scope question. Each is named explicitly in research.md and spec.md as
someone else's feature or the product owner's decision — this task list ships an honest landing
page around those gaps, not a page that pretends they're already closed.
