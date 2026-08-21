# Quickstart: Core App UX (WriteWise revision)

> **STALE — 2026-08-21.** Written against the retired FastAPI backend, the retired
> `003-account-authentication` HTTP contract, and the old four-surface scope (landing + FAQ +
> workspace + profile) built against the `stitch_writewise_ielts_editorial_saas` mockups.
> `spec.md` was rewritten and narrowed to the landing page alone, grounded in the real
> `writewise` Figma design. This file has not been regenerated yet — run `/speckit-plan` and
> `/speckit-tasks` to replace it. See [../README.md](../README.md).


Validates this feature end-to-end per [spec.md](./spec.md), against
[contracts/page-routes.md](./contracts/page-routes.md). Requires `001` and `003`'s backends
running (see their own quickstart.md prerequisites).

## Prerequisites

- Backend running locally behind `cloudflared` with `001` and `003` both implemented
- Frontend dev server running (`npm run dev` in `frontend/`)

## Validation Scenario 1 — Discover and sign up (User Story 1)

1. Visit `/` as a fresh browser session (no cookies).
2. **Expected**: the hero section states the product's purpose; a sign-up CTA and a sign-in CTA
   are both visible and distinguishable; the problem/comparison section and pricing section
   (four plans, exactly one marked recommended) are present (FR-002, FR-017).
3. Select sign-up, complete the form.
4. **Expected**: redirected to `/workspace`, now authenticated.

## Validation Scenario 2 — Run and visualize an assessment, in both themes (User Story 2)

1. As a signed-in learner with no prior submissions, visit `/workspace`.
2. **Expected**: the empty state guides you to submit your first essay (FR-007).
3. Submit a valid essay.
4. **Expected**: an in-progress indicator appears (FR-006), then the result renders in the same
   view: an overall band, a 2×2 grid of the four criteria (each with a band and a visual
   proportion indicator), and expandable line-by-line feedback showing quoted excerpt, category
   tag, and correction/praise (FR-005), within `001`'s 60-second budget.
5. Submit an essay below the minimum word count.
6. **Expected**: a clear rejection message appears and the essay text remains in the input
   (User Story 2 acceptance scenario 3).
7. Toggle the workspace theme to dark.
8. **Expected**: editor, result panel, and feedback tags all remain legible and correctly styled
   (FR-018); toggling mid-submission (start a new submission, switch theme while it's in
   progress) does not interrupt or reset the in-flight submission.
9. Reload the page.
10. **Expected**: the theme preference persists (research.md decision 5).
11. Open `/workspace` directly in a fresh, signed-out browser session.
12. **Expected**: redirected to `/signin` (FR-004), not a blank or broken page.

## Validation Scenario 3 — Manage profile and sign out (User Story 3)

1. As a signed-in learner, visit `/profile`.
2. **Expected**: display name and email are shown (FR-008); no edit controls (FR-012).
3. Select sign out.
4. **Expected**: redirected to `/`; a subsequent visit to `/workspace` or `/profile` redirects to
   `/signin` (FR-009, FR-010).

## Validation Scenario 4 — Find answers on the FAQ page (User Story 4)

1. Visit `/faq` without signing in.
2. **Expected**: questions are grouped into Getting Started, Account & Login, and Essay Scoring
   categories, one open per category at a time (FR-013, FR-016).
3. Type a search term (e.g. "payment") into the search field.
4. **Expected**: matching questions surface across categories (FR-014).
5. Search for a term with no matches.
6. **Expected**: an explicit no-results state is shown, not an empty page (Edge Cases).
7. Read the Essay Scoring category.
8. **Expected**: an explicit statement that the band score is an AI-generated practice estimate,
   not an official IELTS result, is present (FR-015).
9. From `/`, locate the FAQ link in main navigation.
10. **Expected**: it navigates to `/faq` (User Story 4, acceptance scenario 4).

## Validation Scenario 5 — Learn how scoring works before trusting it (User Story 5)

1. On `/`, scroll to the "barrier to a Band 7+" section.
2. **Expected**: three specific frictions with traditional preparation are named (slow feedback,
   vague comments, cost).
3. Continue to the comparison section.
4. **Expected**: WriteWise is compared against traditional tutors on turnaround time, feedback
   detail, cost, and availability (FR-002).
5. Continue to the "how it works" section.
6. **Expected**: all four steps (Submit, Get Scored, Learn the Fix, Track Trend) are shown, with
   the not-yet-built steps honestly marked as future capability rather than implied as available
   today (FR-003).
