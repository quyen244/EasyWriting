# Quickstart: Validating the WriteWise Landing Page

Validation guide for [spec.md](./spec.md)'s acceptance scenarios. Content shapes are in
[data-model.md](./data-model.md), outbound dependencies in
[contracts/page-routes.md](./contracts/page-routes.md). This is a run guide — implementation
belongs to `/speckit-tasks` and the components themselves.

## Prerequisites

- `frontend/` installed (`npm install`), no new dependency required for this feature (research.md
  confirms no Supabase/backend call happens on this page).
- Local dev server: `npm run dev` (from `frontend/`), page at `http://localhost:3000/`.

## Known limitation to keep in mind while validating (research.md R4)

Clicking "Get started"/"Login" takes you to real `/signup`/`/signin` pages that will error on
submit — their Supabase wiring doesn't exist yet. **This is expected and out of scope for this
feature.** Validate that the link is reachable and correctly labelled; do not treat a submit
failure on those pages as a bug in this feature.

## Validating each user story

### User Story 1 — Understand the pitch and start for free

1. Load `/` without scrolling. **Expected**: the headline and supporting line are fully visible;
   read them aloud — can you state what WriteWise does? (SC-001)
2. Without scrolling further, locate "Get started for free" and "How it works". **Expected**: both
   visible in the hero (FR-002).
3. Click "How it works". **Expected**: smooth-scrolls to the How-It-Works section; URL gains
   `#how-it-works`; no full navigation/reload.
4. Scroll to the very bottom, before the footer. **Expected**: a final CTA band repeats the
   sign-up action (FR-021).
5. At any scroll position, check the persistent nav. **Expected**: WriteWise mark, primary links,
   "Login" and "Join now" both present and equally prominent (FR-003, US1 scenario 4).

### User Story 2 — Focus-area selection is honest about Speaking

1. Scroll to "Choose your focus area". **Expected**: exactly two cards, Writing and Speaking
   (FR-004).
2. Inspect the Speaking card. **Expected**: a visible "Coming soon" marker; its action (if any)
   does not read as "start" or "try" — at most a waitlist/notify action (FR-006).
3. Click the Writing card's action. **Expected**: leads toward the grading experience described by
   `001-ielts-score-assessment`, not a placeholder (FR-005).
4. Confirm in `data-model.md`'s `NavLink`/focus-area content: Speaking's `available` flag is
   `false` — this is what the disabled-treatment component (research.md R5) keys off.

### User Story 3 — Credibility sections stay truthful to 001

1. Scroll to "How WriteWise works". **Expected**: exactly 3 steps — Analyze, Evaluate Criteria,
   Score & Improve (FR-007); the Evaluate Criteria step names Task Response/Achievement, Coherence
   & Cohesion, Lexical Resource, Grammatical Range & Accuracy verbatim — cross-check against
   [../001-ielts-score-assessment/spec.md](../001-ielts-score-assessment/spec.md) §7's criterion
   table (FR-008).
2. Scroll to "Why choose WriteWise?". **Expected**: four stat cards; read each caption — none
   reads as a guaranteed individual outcome ("you will gain +1.5 bands") rather than an
   illustrative aggregate (FR-009).
3. Scroll to the Comparison section. **Expected**: three columns (Traditional Teacher, Other AI
   Tools, WriteWise), WriteWise visibly marked as the recommended choice; every claim listed under
   WriteWise is checked against what 001 actually ships — no explanation-quality claim beyond
   FR-013..FR-016 of 001's spec (FR-011).

### User Story 4 — Pricing is complete and honest about Speaking's gating

1. Scroll to "Choose your plan". **Expected**: exactly four cards — Free, Monthly, Yearly,
   Lifetime — exactly one carries a featured/recommended badge (FR-012, FR-013).
2. Read the Free plan's feature list. **Expected**: describes an actual scored submission (bounded
   by a daily limit), not a locked preview (FR-014).
3. Read the Yearly and Lifetime feature lists. **Expected**: "Speaking assessment" (or "all future
   features") is qualified as not-yet-usable, not presented as an immediate perk (FR-015).
4. Click any paid plan's CTA. **Expected**: lands on `/signup` with that plan's identity carried
   forward (e.g. `?plan=yearly` — FR-016); inspect the query string or equivalent mechanism.
5. Cross-check the displayed Yearly/Lifetime prices (`$49.9`, `$149.9` as designed) against
   whatever the product owner has since confirmed — flag a mismatch as a content issue, not a
   defect in this feature's logic (Edge Cases).

### User Story 5 — Testimonials

1. Scroll to "What Students Think". **Expected**: at least three testimonials, each naming a
   specific improvement (grammar repetition, vocabulary, coherence & cohesion — not generic praise
   — FR-017).
2. Check each testimonial's track. **Expected**: no `"General Training"` testimonial renders
   unless the flagged decision (spec.md callout) has resolved in favour of supporting that track
   (FR-018, `data-model.md`'s `Testimonial` validation rule).

### User Story 6 — FAQ teaser

1. Scroll to "Questions? We've Got Answers.". **Expected**: exactly three questions (FR-020).
2. Expand each one independently; confirm the other two remain collapsed and unaffected — no
   navigation occurs.
3. Read the second answer (task-type coverage). **Expected**: states both Task 1 and Task 2 are
   supported, one at a time per submission — not a full timed mock test (User Story 6 scenario 3).
4. Read the third answer (explainability). **Expected**: describes a band plus a written
   justification per criterion; does **not** claim machine-verified verbatim quoting from the
   essay (research.md R6 — this is the exact overclaim already found once in `faqData.ts` and
   deliberately not repeated here).

## Cross-cutting checks

- **Link audit** (SC-005): enumerate every nav/footer link; every one either resolves to a real
  route in the app or renders with `available: false`'s disabled treatment. Zero silent dead ends.
- **Reduced motion** (Edge Cases): with OS-level reduced-motion enabled, reload `/` — the hero's
  emphasis-word treatment and any scroll reveals must not block the page's core content from being
  fully readable immediately.
- **Component tests**: `npm test` (Vitest) — one test file per rewritten/new component under
  `frontend/tests/unit/landing/`, per research.md R7.
- **E2E**: `npm run test:e2e` (Playwright) — `how-it-works.spec.ts` (existing, updated for new
  copy) and a new `landing-page.spec.ts` covering the sections this rewrite adds. Leave
  `discover-and-signup.spec.ts`/`profile-signout.spec.ts` as-is per research.md R4/R7 — their
  auth-contract stubs are the Supabase-platform feature's concern, not this one's.
