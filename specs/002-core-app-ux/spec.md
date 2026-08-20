# Feature Specification: Core App UX — Landing, FAQ, Workspace & Profile

**Feature Branch**: `002-core-app-ux`

**Created**: 2026-08-19
**Revised**: 2026-08-20 — rewritten against real Stitch-generated designs (`stitch_writewise_ielts_editorial_saas/`), superseding the earlier version based on the original `stitch_ielts_writing_diagnostic` mockup.

**Status**: **SUPERSEDED** — 2026-08-21

> This spec was written against the retired FastAPI backend and the
> `stitch_writewise_ielts_editorial_saas` design set. Constitution v3.0.0 replaced the backend
> with Supabase, and the UI is being redesigned from scratch against new visual references, so
> both of this spec's foundations are gone. A replacement mock-test experience spec is planned —
> see [../README.md](../README.md).
>
> **Still worth reading**: the route inventory and access rules in
> [contracts/page-routes.md](./contracts/page-routes.md), the FAQ content requirements, and the
> pricing/landing content structure. These describe *what the product shows a learner*, which the
> platform change does not affect.
>
> **Obsolete**: every `003 POST /api/v1/auth/*` dependency (Supabase Auth now), the
> `useAuth`/access-token design (`supabase-js` manages sessions), the `cloudflared` cross-origin
> reasoning in [research.md](./research.md), and the Stitch design references throughout.
>
> **Missing**: this spec predates the move to a full mock test — it specifies a single-essay
> workspace with no Task 1 / Task 2 split and no timer.

**Input**: User description: "UI/UX for the landing page, FAQ, learner workspace (with dark mode), and profile — rewritten against the `marketing_landing_page_fresh_refresh`, `frequently_asked_questions`, and `learner_workspace` Stitch designs, styled per the `academic_editorial` design system."

## Product name

The generated designs consistently name the product **WriteWise** (landing, FAQ, workspace, and admin mockups all use this name in their nav/title). This spec adopts it as the working product name, superseding the earlier placeholder "BandFlow." Flag to confirm: if this isn't the intended final brand name, say so before `/speckit-plan` locks it into code (page titles, footer copyright, etc.).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover the product and sign up (Priority: P1)

A visitor lands on the marketing page, understands what WriteWise does and why they should trust its scoring, sees what it costs, and starts creating an account.

**Why this priority**: Without an effective front door, no learner ever reaches the scoring feature this whole product is built around.

**Independent Test**: Load the landing page as an unauthenticated visitor; verify the value proposition is clear, the problem/differentiation content is present, pricing is visible, and a working sign-up CTA exists.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the landing page, **When** they read the hero, **Then** they can state the product's purpose (AI-scored IELTS Writing feedback against real criteria, in under 60 seconds) without visiting any other page.
2. **Given** a visitor scrolls past the hero, **When** they reach the comparison section, **Then** they can see concretely how WriteWise differs from a traditional tutor (turnaround time, feedback detail, cost, availability).
3. **Given** a visitor reaches the pricing section, **When** they compare the four plans, **Then** exactly one plan is marked as recommended and the free plan is presented as a real, usable option rather than a crippled trial.
4. **Given** an unauthenticated visitor, **When** they select a sign-up call-to-action (hero, pricing card, or final CTA), **Then** they are taken to account creation.
5. **Given** a returning visitor who already has an account, **When** they view the landing page, **Then** they can find a sign-in call-to-action as easily as sign-up.

---

### User Story 2 - Run an assessment and see it visualized in the workspace (Priority: P1)

A signed-in learner opens their workspace, submits an essay for scoring (the assessment feature specified in `001-ielts-score-assessment`), and sees the result — overall band, four criterion bands, and line-by-line explanations — visualized within the workspace without navigating away. The workspace is usable in either a light or dark color theme.

**Why this priority**: This is the core product loop — where `001`'s scoring value actually reaches a learner.

**Independent Test**: As a signed-in learner with no prior assessments, submit an essay from the workspace and verify the scored result renders in the same view, in both light and dark theme.

**Acceptance Scenarios**:

1. **Given** a signed-in learner with no prior assessments, **When** they open the workspace, **Then** they see an empty-state message inviting their first submission rather than a blank or broken screen.
2. **Given** a signed-in learner in the workspace, **When** they submit an essay, **Then** they see a clear in-progress state while scoring runs, followed by the visualized result: an overall band, a 2×2 breakdown of the four criteria (each with its own band and a visual proportion indicator), and an expandable line-by-line feedback list where each item shows the quoted sentence, a category tag (e.g. Grammar, Vocabulary), and a suggested correction or a note of praise.
3. **Given** a signed-in learner whose submission is rejected or fails (per `001-ielts-score-assessment`), **When** the workspace shows the error, **Then** their essay text remains in the input so they can correct and resubmit without retyping.
4. **Given** an unauthenticated visitor, **When** they try to open the workspace directly, **Then** they are redirected to sign in first.
5. **Given** a signed-in learner, **When** they switch the workspace's color theme, **Then** every element — editor, result panel, feedback tags — remains legible and correctly styled in both light and dark theme.

---

### User Story 3 - Manage account from the profile page (Priority: P2)

A signed-in learner views their account details on a profile page and can sign out from it.

**Why this priority**: Necessary account hygiene and trust-building, but the product delivers its core value (User Story 2) without it.

**Independent Test**: As a signed-in learner, open the profile page and verify account details display and sign-out works.

**Acceptance Scenarios**:

1. **Given** a signed-in learner, **When** they open the profile page, **Then** they see their account's display name and email.
2. **Given** a signed-in learner on the profile page, **When** they select sign out, **Then** their session ends and they are returned to the landing page, unable to reach the workspace or profile again without signing in.

---

### User Story 4 - Find answers on the FAQ page (Priority: P2)

A visitor or learner with a specific question (pricing, account, how scoring works) goes to a dedicated FAQ page, searches or browses by category, and gets a direct answer — including an explicit answer to "is this an official score."

**Why this priority**: A dedicated, searchable FAQ page is now part of the approved design (`frequently_asked_questions`), not just a landing-page teaser — it's the primary destination for pre-purchase objection handling and for the score's legal/trust disclaimer.

**Independent Test**: Load the FAQ page without an account, search for a term, and verify matching questions surface; confirm the "is the score official" disclaimer is present and unambiguous.

**Acceptance Scenarios**:

1. **Given** any visitor, **When** they open the FAQ page, **Then** questions are grouped into categories (Getting Started, Account & Login, Essay Scoring) with one question open at a time per category as they click through.
2. **Given** a visitor types into the FAQ search field, **When** they enter a term (e.g. "payment"), **Then** matching questions are surfaced.
3. **Given** any visitor, **When** they read the Essay Scoring category, **Then** they find an explicit statement that the band score is an AI-generated practice estimate, not an official IELTS result.
4. **Given** a visitor on the landing page, **When** they look for deeper answers than the hero/comparison content gives, **Then** a link to the full FAQ page is reachable from the main navigation.

---

### User Story 5 - Learn how scoring works before trusting it (Priority: P3)

A visitor reads the landing page's problem/comparison/how-it-works content to understand, in plain language, why WriteWise's feedback should be trusted before they sign up.

**Why this priority**: Builds trust and reduces support questions, but is supplementary to User Story 1 rather than a separate destination — this is landing-page content, not a separate page.

**Independent Test**: Load the landing page without an account and verify it explains the four IELTS criteria, names the friction of traditional prep, and shows how WriteWise compares.

**Acceptance Scenarios**:

1. **Given** any visitor, **When** they reach the "barrier to a Band 7+" section, **Then** it names three specific frictions with traditional preparation (slow feedback, vague comments, cost).
2. **Given** any visitor, **When** they reach the comparison section, **Then** it compares WriteWise against traditional tutors on turnaround time, feedback detail, cost, and availability.
3. **Given** any visitor, **When** they reach the "how it works" section, **Then** it shows the real four-step product flow: Submit, Get Scored, Learn the Fix, Track Trend — with the last step honestly marked as a future capability, not implied as available today.

---

### Edge Cases

- What does the workspace show while a submitted essay is still being scored (up to the 60-second budget from `001-ielts-score-assessment`)?
- What happens if a learner's session expires while they are in the middle of typing an essay in the workspace?
- How does the profile page behave if account details fail to load (e.g. a transient backend error)?
- What happens if a learner navigates directly to a workspace or profile URL without ever having signed in?
- What happens if a learner switches color theme mid-submission (e.g. while scoring is in progress)? The in-progress and result states must re-render correctly in the newly selected theme, not just the static chrome.
- What happens when an FAQ search term matches nothing?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present a landing page, reachable without an account, that states the product's purpose and offers sign-up and sign-in as clearly distinguishable actions.
- **FR-002**: System MUST include, on the landing page, a problem-framing section naming the specific frictions of traditional IELTS preparation (slow feedback, vague comments, cost) and a comparison section showing WriteWise against traditional tutors on turnaround time, feedback detail, cost, and availability.
- **FR-003**: System MUST include, on the landing page, a four-step "how it works" section (Submit, Get Scored, Learn the Fix, Track Trend), with any step not yet built (Learn the Fix, Track Trend — both future features per the project constitution) presented honestly as part of the product vision rather than implying it works today.
- **FR-004**: System MUST restrict the workspace and profile pages to signed-in learners, redirecting unauthenticated visitors to sign-in.
- **FR-005**: System MUST let a signed-in learner submit an essay for scoring from within the workspace and see the resulting overall band, four criterion bands (each with a visual proportion indicator), and expandable line-by-line feedback rendered in that same workspace view, without a separate navigation step.
- **FR-006**: System MUST show a clear in-progress indication in the workspace while a submitted essay is being scored.
- **FR-007**: System MUST show a first-time/empty-state message in the workspace guiding a learner who has never submitted an essay toward submitting one.
- **FR-008**: System MUST display, on the profile page, the signed-in learner's display name and email.
- **FR-009**: System MUST let a signed-in learner sign out from the profile page, ending their session and returning them to the landing page.
- **FR-010**: System MUST NOT allow a learner to reach the workspace or profile page after signing out without signing in again.
- **FR-011**: System MUST show only the current/most recent assessment (input + result) within the workspace itself — not a list or history of past assessments. Browsing past submissions and the progress dashboard remain separate, explicitly-bonus/future features per the project constitution.
- **FR-012**: The profile page is view-only (display name, email) plus sign-out for this MVP; no in-place editing of account details is required.
- **FR-013**: System MUST provide a dedicated FAQ page, reachable from the main navigation, with questions grouped into categories: Getting Started, Account & Login, Essay Scoring.
- **FR-014**: The FAQ page MUST include a search input that filters visible questions by matching text as the learner types.
- **FR-015**: FAQ answers MUST include an explicit, unambiguous statement that the band score is an AI-generated estimate for practice purposes and is not an official or certified IELTS result.
- **FR-016**: Opening one FAQ answer within a category SHOULD close any other open answer in that category, keeping the page scannable.
- **FR-017**: System MUST present pricing on the landing page as four plans — Free, Monthly, Yearly, Lifetime — with exactly one plan marked as recommended. This is a **display-only** pricing section for this feature; checkout, payment processing, and plan enforcement are not in scope here (see Assumptions).
- **FR-018**: The workspace MUST support both a light and a dark color theme, with a way for the learner to switch between them, and every workspace element (editor, result panel, feedback tags, empty state) MUST remain legible and correctly styled in both.

### Key Entities

- **Landing Page**: The unauthenticated marketing entry point — hero, problem/comparison, how-it-works, product experience preview, testimonials (expert and learner), pricing display, final CTA, footer.
- **FAQ Page**: A separate content surface from the landing page — categorized, searchable questions and answers, not a data entity.
- **Workspace Session**: A signed-in learner's current view of the assessment tool — what they have typed, whether scoring is in progress, the most recent result, and the active color theme — scoped to the browsing session, not a persisted new entity beyond what `001-ielts-score-assessment` already defines (`EssaySubmission`, `AssessmentResult`).
- **Profile**: The signed-in learner's own account view — sourced from the `Account` entity defined by `003-account-authentication`, not owned by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can state the product's purpose and name at least one way it differs from a traditional tutor, after reading the landing page alone, in a usability check.
- **SC-002**: At least 90% of signed-in learners who submit an essay from the workspace successfully see a visualized result or a clear error message without needing to reload the page.
- **SC-003**: A signed-in learner can locate and use sign-out from the profile page in under 10 seconds in a usability check.
- **SC-004**: 100% of attempts to reach the workspace or profile page while signed out are redirected to sign-in rather than showing a broken or partially loaded page.
- **SC-005**: A first-time learner in the workspace's empty state can identify how to submit their first essay without external help, in a usability check.
- **SC-006**: At least 90% of visitors asked to find the "is this an official score" answer can do so via the FAQ page's search or categories within 30 seconds, in a usability check.
- **SC-007**: 100% of workspace elements pass a manual legibility check (text contrast, visible focus states) in both light and dark theme.

## Assumptions, Decisions & Flags

These are the judgment calls made while reconciling the new Stitch designs with prior specs — flag any of these that should go the other way.

- **Admin dashboard is out of scope for this feature.** A design (`admin_dashboard`) now exists, but it serves a different persona (operator, not learner) and a different access level. Per the project's own UX research notes, it should become its own feature (`004-admin-dashboard`) via a separate `/speckit-specify`, not be folded into this learner-facing spec.
- **Pricing numbers were corrected, not copied from the mockup.** The generated landing page shows placeholder pricing ($19/mo, 2 essays/month free, $149 lifetime). This spec uses the actual intended pricing from prior discussion instead: **Free — 1 essay/day**, **Monthly — $4.99**, **Yearly — $49.9 (recommended)**, **Lifetime — $99**. Confirm before `/speckit-plan`.
- **The FAQ's "Sign in with Google" answer conflicts with `003-account-authentication`**, which explicitly limits sign-up/sign-in to email + password for this MVP (OAuth deferred). This spec's FR-013–016 does not require Google sign-in; if OAuth is actually wanted now, `003` needs to be revisited first — this spec doesn't silently add it.
- **Design system: two alternatives were generated (`lumina_academic`, mint/green accent; `academic_editorial`, gold-for-scores accent) and they weren't applied consistently** — the landing, workspace, and admin mockups all use `academic_editorial` (Deep Ink Indigo `#0D3368`/`#2A4A80` primary, Muted Gold `#7B5800`/`#FDCD70` reserved for scores, Literata display serif + Geist UI sans), but the FAQ page mockup used `lumina_academic`'s mint-green tokens instead. This spec assumes **`academic_editorial` is canonical**; the FAQ page's visual implementation should be brought in line with it rather than treated as an intentional third variant.
- **The workspace mockup's 40:00 countdown timer and sidebar links for "My Essays," "Performance," "Feedback," and "Admin Center"** are not specified as functional requirements here — they read as either exam-simulation polish (timer) or placeholders for not-yet-built future pages (history/performance/feedback-library — all adjacent to the constitution's bonus dashboard feature), and "Admin Center" appearing in a learner's own sidebar looks like a mockup artifact rather than an intentional cross-persona link. None are blocking; revisit if any was actually intended as current scope.
- Visual design follows the `academic_editorial` system as the design source of truth for this feature, superseding the earlier `stitch_ielts_writing_diagnostic` mockup — the constitution's design-reference pointer was updated to match (v2.0.1, 2026-08-20, per `/speckit-analyze` finding K1).
- This feature covers the UI/UX around submitting and viewing one assessment at a time; the scoring logic, API, and data model it displays are defined by `001-ielts-score-assessment` and are not re-specified here. `001` itself ships no UI (corrected per `/speckit-analyze` finding I1) — this feature builds the workspace exactly once, against `001`'s stable API.
- Account creation and sign-in mechanics themselves are specified separately (`003-account-authentication`) and are treated here as an existing capability this feature's pages call into.
