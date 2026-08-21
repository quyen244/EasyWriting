# Feature Specification: WriteWise Landing Page

**Feature Branch**: `002-core-app-ux` *(directory name kept for continuity — git history, the
constitution, and `specs/README.md` all reference it; the feature itself is now scoped to the
landing page only, not the four-surface "core app UX" bundle this directory originally held)*

**Created**: 2026-08-19
**Rewritten**: 2026-08-21 — narrowed from the four-surface bundle (landing, FAQ, workspace,
profile) to the **landing page alone**, and re-grounded in a real Figma design instead of the
retired Stitch HTML mockups. FAQ, workspace, and profile no longer have a spec home — see
[../README.md](../README.md).

**Status**: Draft

**Design reference**: Figma file `writewise` (fileKey `JGr2ZuKKC8JEiAIHzNAFLH`), node `1001:2`
("Html → Body") — <https://www.figma.com/proto/JGr2ZuKKC8JEiAIHzNAFLH/writewise?node-id=1001-2>,
read via the Figma MCP connection on 2026-08-21. This is now the source of truth for this page's
layout and copy.


**Input**: User description: "UI/UX cho landing page, dùng thiết kế Figma project 'writewise'."

---

## ⚠️ Decision needed before `/speckit-plan`: General Training

The Figma design's top nav, footer, and one testimonial all reference **General Training** as a
track WriteWise supports (nav: "Academic / General Training"; footer "Product" column: same two
links; one testimonial is attributed to a "General Training" student). But
[001-ielts-score-assessment](../001-ielts-score-assessment/spec.md) explicitly scopes General
Training out (§3: *"IELTS General Training. Its Task 1 uses different descriptors"*) — the grader
this landing page sends visitors to cannot actually score a General Training Task 1 yet.

This spec does **not** resolve that conflict — it flags it, per the same rule that a product-name
mismatch was flagged (not silently resolved) in this spec's original version. Three ways forward,
each with different scope for this feature:

1. **Remove General Training from the copy** until 001 supports it — smallest scope, but changes
   design-approved copy.
2. **Keep the copy, but the General Training nav/footer links go to a "coming soon" state** — no
   new page-building, but visitors reach a dead end after clicking a primary nav item.
3. **Treat General Training as in-scope and build toward it** — largest scope; 001 would need
   revisiting too.

FR-018, FR-019, and the Edge Cases section below assume **option 2** as the default (smallest
change that doesn't mislead a visitor into a broken link), consistent with the Quick Guidelines'
instruction to default rather than block when a reasonable default exists — but this is a product
decision, not a technical one, and should be confirmed before implementation.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand what WriteWise does and start for free (Priority: P1)

A visitor lands on the page, reads the hero, and can state in one sentence what WriteWise does
without scrolling further — then, whenever they're ready (immediately, or after reading the rest
of the page), can start a free account from a CTA that is never more than one scroll away.

**Why this priority**: Every other section on this page exists to strengthen a decision this
story makes possible. Without a clear pitch and a reachable CTA, nothing below it matters.

**Independent Test**: Load the page as an unauthenticated visitor; verify the hero states the
product's purpose without requiring any scroll or interaction, and that a sign-up CTA is visible
in the hero, and again in the final call-to-action band before the footer.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor loads the page, **When** they read the hero ("Master your
   IELTS Writing with AI-powered feedback" + the supporting line about instant, examiner-grade
   evaluations), **Then** they can state the product's purpose without visiting any other page or
   scrolling.
2. **Given** a visitor is in the hero, **When** they look for a way to start, **Then** a primary
   "Get started for free" action is visible without scrolling, alongside a secondary "How it
   works" action that leads to the How-It-Works section without a full page navigation.
3. **Given** a visitor scrolls to the bottom of the page, **When** they reach the final CTA band
   ("Ready to turn your next essay into a higher band score?"), **Then** a "Start scoring for
   free" action is available there too, so reaching the bottom is never a dead end.
4. **Given** a returning visitor who already has an account, **When** they look at the persistent
   navigation, **Then** a sign-in action ("Login") is exactly as reachable as sign-up ("Join now").
5. **Given** any visitor, **When** they view the persistent navigation, **Then** the WriteWise
   name/mark is present and the primary nav items (Pricing, Resources, and the two track links
   per the General Training decision above) are reachable from any scroll position.

---

### User Story 2 - Choose a focus area and know what's available today (Priority: P1)

A visitor sees that WriteWise addresses two IELTS skills — Writing and Speaking — and can
immediately tell that Writing is usable now while Speaking is a future capability, without being
misled into expecting a Speaking assessment that doesn't exist yet.

**Why this priority**: The design's "Choose your focus area" section is the visitor's first
concrete choice on the page, and it is also the page's most direct connection to the product
roadmap (Speaking/ASR is a planned, not-yet-built feature per the constitution). Overpromising
here creates real trust damage the moment a visitor clicks through.

**Independent Test**: View the focus-area section as an unauthenticated visitor; verify Writing
reads as available and actionable, Speaking reads as a future capability, and interacting with
the Speaking card does not lead anywhere that implies it works today.

**Acceptance Scenarios**:

1. **Given** a visitor reaches the focus-area section, **When** they read it, **Then** exactly
   two options are presented — Writing and Speaking — each with a one-line description of what it
   assesses.
2. **Given** the Speaking option, **When** a visitor reads its card, **Then** it is visibly marked
   "Coming soon" and is not presented as an equal, currently-usable alternative to Writing.
3. **Given** a visitor selects Writing, **When** they act on it ("Start practicing"), **Then**
   they are taken toward the actual grading experience (001-ielts-score-assessment), not a
   placeholder.
4. **Given** a visitor interacts with the Speaking card (clicks it, or its own CTA if it has one),
   **When** the interaction resolves, **Then** it does not enroll them in, launch, or imply access
   to a live speaking assessment — at most a waitlist/notify-me action, or no action at all.

---

### User Story 3 - Trust that the scoring is real and understand how it works (Priority: P1)

A visitor learns, in plain terms, how a submission becomes a score (Analyze → Evaluate Criteria →
Score & Improve), sees why that's different from a traditional tutor or a generic AI tool, and
does not encounter any claim here that contradicts what the grader (001) actually delivers.

**Why this priority**: A visitor who doesn't believe the scoring is credible will not pay for it
or trust its output. This is the credibility-building arc between the pitch (US1) and the
purchase decision (US4).

**Independent Test**: Read the How-It-Works and Comparison sections; verify the 3-step
explanation matches what 001's grader actually does (one submission, four official criteria named
by their real names, a band and comment for each), and that the comparison table's claims about
WriteWise are ones the product can back up.

**Acceptance Scenarios**:

1. **Given** a visitor reaches "How WriteWise works", **When** they read it, **Then** exactly
   three steps are shown — Analyze, Evaluate Criteria, Score & Improve — and the Evaluate Criteria
   step names the four official IELTS criteria (Task Response/Achievement, Coherence & Cohesion,
   Lexical Resource, Grammatical Range & Accuracy), matching 001's actual criteria set exactly
   rather than a marketing simplification of it.
2. **Given** a visitor reaches the "Why choose WriteWise" stat cards, **When** they read a
   headline figure (e.g. "+1.5", "100+", "5.0+"), **Then** it is presented as an illustrative or
   aggregate figure, not as a promised individual outcome — consistent with constitution TP-1's
   requirement that scores are presented as provisional, not guaranteed.
3. **Given** a visitor reaches the Comparison section, **When** they read the three columns
   (Traditional Teacher, Other AI Tools, WriteWise), **Then** WriteWise is visually distinguished
   as the recommended choice ("Best choice"), and every claim listed for it (affordable
   subscription, objective scoring, grammar & vocabulary fixes) is one the shipped product
   actually provides — no claim here may promise a capability 001 does not have (e.g., it must
   not claim explanations if TP-1 is still open, or a Speaking capability that doesn't exist).

---

### User Story 4 - Compare pricing and choose a plan (Priority: P2)

A visitor compares four plans, understands what each includes, sees one clearly recommended, and
can tell — before paying — that Speaking assessment is a Yearly/Lifetime entitlement for a
capability that doesn't exist yet, not a currently-usable perk.

**Why this priority**: Pricing is where a visitor commits money. It matters less than the pitch
and credibility sections (a visitor who never gets this far generates no revenue either way), but
a misleading pricing page is a direct trust and possibly legal problem, which is why it still
outranks lower-stakes sections like testimonials.

**Independent Test**: Compare the four pricing cards; verify exactly one is marked as the
featured/recommended plan, the free plan grants an actual scored result (not a locked preview),
and any mention of Speaking assessment is qualified as a future entitlement.

**Acceptance Scenarios**:

1. **Given** a visitor reaches pricing, **When** they compare the four plans (Free, Monthly,
   Yearly, Lifetime), **Then** exactly one plan carries a distinguishing badge marking it as the
   recommended choice, and the free plan is presented as a real, usable option — it grants an
   actual scored submission (bounded by its stated daily limit), not a crippled demo.
2. **Given** the Yearly and Lifetime plans list "Speaking assessment" (directly, or via
   "All future features") among their included features, **When** a visitor reads this, **Then**
   it is clear this is a forward-looking entitlement for a capability not live today — it must not
   be presented as something they can use immediately upon purchase.
3. **Given** a visitor selects any paid plan's "Get started" action, **When** the interaction
   resolves, **Then** they are taken into the sign-up flow with that plan noted, not silently
   dropped onto a generic sign-up with the plan choice lost.
4. **Given** the displayed prices, **When** they are implemented, **Then** they use the amounts
   confirmed with the product owner rather than the literal design values, which read as `$49.9`
   (Yearly) and `$149.9` (Lifetime) — one decimal place short of a typical price and worth
   confirming isn't a placeholder before it goes live (see Edge Cases).

---

### User Story 5 - See evidence that real learners improved (Priority: P2)

A visitor reads a few short testimonials from real-feeling students and their specific
improvement areas, reinforcing the pitch with social proof rather than abstract claims.

**Why this priority**: Reinforces trust already being built in US3; it is not itself a blocker to
conversion the way US1–US3 are, since a visitor can convert without reading a single testimonial.

**Independent Test**: Read the testimonials section; verify each entry names a specific,
plausible improvement (not generic praise) and a learner profile (name and track).

**Acceptance Scenarios**:

1. **Given** a visitor reaches "What Students Think", **When** they read it, **Then** each of the
   three testimonials names a specific aspect of writing the student improved (e.g. identifying
   repetitive grammar mistakes, vocabulary, coherence and cohesion) rather than generic praise.
2. **Given** a testimonial names a track (Academic or General Training), **When** displayed,
   **Then** it is consistent with whatever resolution the General Training decision above reaches
   — a testimonial should not reference a track the product cannot yet score.

---

### User Story 6 - Get quick answers without leaving the page (Priority: P3)

A visitor with a quick doubt (accuracy, task coverage, explainability) can check a short FAQ
teaser on the page itself before deciding whether to dig deeper or sign up.

**Why this priority**: Lowest priority — it resolves hesitation for visitors who already have a
specific doubt, but most visitors convert or bounce without reading it.

**Independent Test**: Open each of the three FAQ teaser items; verify each expands to reveal an
answer, and collapses again independently of the other two.

**Acceptance Scenarios**:

1. **Given** the FAQ teaser section, **When** a visitor views it, **Then** exactly three
   questions are shown: "How accurate is the AI scoring?", "Does it support both Task 1 and Task
   2?", and "Will I understand why I got a certain score?".
2. **Given** a visitor selects one question, **When** it expands, **Then** its answer is shown
   without navigating away from the landing page, and the other two remain independently
   collapsible.
3. **Given** the second question ("Does it support both Task 1 and Task 2?"), **When** it is
   answered, **Then** the answer is truthful about 001's actual scope — both tasks, one at a time
   per submission, not a full timed mock test (that is a separate, not-yet-specified feature).
4. **Given** the third question ("Will I understand why I got a certain score?"), **When** it is
   answered, **Then** the answer reflects 001's actual explainability — per-criterion bilingual
   comments — worded so it does not overstate machine-verified evidence-quoting, which remains
   open under constitution TP-1.

---

### Edge Cases

- **A visitor clicks a footer or secondary-nav link with no destination yet** (Blog, Practice
  Tests, Band Calculators, About Us, Contact, Privacy Policy, and — pending the General Training
  decision — the General Training track itself). A Figma mockup doesn't fail on click; a real site
  does. Default: these render as visibly disabled or "coming soon", never as a broken link or a
  silent 404 (see FR-020).
- **A visitor clicks a FAQ item whose answer isn't drafted anywhere yet.** The design's three FAQ
  items are questions only — no answer copy exists in the source design. This spec defines the
  interactive container (three items, independent expand/collapse); the answer copy is a
  copywriting task to complete before or during implementation, not an engineering unknown (see
  Assumptions).
- **The Yearly and Lifetime prices in the design (`$49.9`, `$149.9`) look like truncated
  placeholders**, not final one-decimal-short pricing — one-tenth of a cent below a round number
  is an unusual price point. Confirm the real values before they ship (User Story 4, scenario 4).
- **A visitor on a narrow (mobile) viewport.** The design was read as a single desktop-width frame
  (1280px); responsive behavior below that width is not specified here and is a reasonable
  implementation default (standard responsive stacking), not a design-sourced requirement.
- **A visitor with JavaScript-driven animations disabled or reduced-motion preferences set** (the
  hero's rotating emphasis words — "AI-powered", "personalized" style treatment — and any
  scroll-triggered reveal). The page's core message must remain fully readable with no animation
  at all.

---

## Requirements *(mandatory)*

### Functional Requirements

**Hero and navigation**

- **FR-001**: The page MUST present, without scrolling, a headline stating the product's purpose
  and a supporting line describing the value (instant, examiner-grade evaluations and
  personalized tips).
- **FR-002**: The page MUST present, without scrolling, a primary sign-up action and a secondary
  action leading to the How-It-Works section.
- **FR-003**: The persistent navigation MUST show the WriteWise name/mark, primary section links,
  and both a sign-in and a sign-up action, at every scroll position.

**Focus-area selection**

- **FR-004**: The page MUST present exactly two focus-area options: Writing and Speaking.
- **FR-005**: The Writing option MUST be presented as available now, with an action that leads
  toward the actual grading experience (001-ielts-score-assessment).
- **FR-006**: The Speaking option MUST be visibly marked as not yet available ("Coming soon") and
  MUST NOT present an action that implies a working speaking assessment exists.

**How it works and credibility**

- **FR-007**: The page MUST present exactly three steps describing the grading process: Analyze,
  Evaluate Criteria, and Score & Improve.
- **FR-008**: The Evaluate Criteria step MUST name the four official IELTS Writing criteria by
  their real names, matching 001-ielts-score-assessment's criteria set exactly.
- **FR-009**: Any headline statistic presented as evidence of effectiveness (e.g. an average band
  improvement, a feedback-item count, a scoring-time figure) MUST be presented as an illustrative
  or aggregate figure, not a promised individual result, per constitution TP-1.
- **FR-010**: The page MUST present a comparison of WriteWise against a traditional teacher and
  against generic AI tools, across at least turnaround time, cost, and objectivity of scoring,
  with WriteWise visibly marked as the recommended choice.
- **FR-011**: No claim on the page (comparison, stats, or elsewhere) MUST promise a capability the
  shipped product does not have at the time it is displayed — this includes not claiming
  evidence-verified explanations while constitution TP-1 remains open, and not claiming a working
  Speaking assessment.

**Pricing**

- **FR-012**: The page MUST present exactly four pricing plans: Free, Monthly, Yearly, and
  Lifetime, each with its price, billing period (where applicable), and included features.
- **FR-013**: Exactly one plan MUST be visibly marked as the recommended/featured choice.
- **FR-014**: The Free plan MUST grant an actual scored submission (subject to its stated daily
  limit), not a locked preview or a demo that produces no real result.
- **FR-015**: Where a plan lists "Speaking assessment" or "all future features" among its
  included items, the page MUST make clear this is a forward-looking entitlement, not a
  capability usable at the time of purchase.
- **FR-016**: Selecting a plan's call-to-action MUST carry that plan's identity into the sign-up
  flow, so the visitor's choice is not lost.

**Social proof and FAQ**

- **FR-017**: The page MUST present at least three testimonials, each naming a specific
  improvement area rather than generic praise.
- **FR-018**: A testimonial or nav/footer link MUST NOT reference a track (Academic / General
  Training) the underlying grader cannot score, without that track being visibly marked as not
  yet supported — see the flagged decision above.
- **FR-019**: Any nav or footer link to a track, page, or resource that does not exist yet MUST
  render as visibly disabled or "coming soon" rather than as a broken or silently non-functional
  link.
- **FR-020**: The FAQ teaser MUST present exactly three questions, each independently
  expandable/collapsible without navigating away from the page.

**Final CTA and footer**

- **FR-021**: A final call-to-action, equivalent in effect to the hero's primary action, MUST
  appear again near the bottom of the page, before the footer.
- **FR-022**: The footer MUST present the WriteWise name/mark, a tagline, grouped links (product,
  resources, company), and a copyright line.

### Key Entities

- **Plan**: One of the four pricing tiers — name, price, billing period, feature list, and
  whether it is the featured/recommended plan. Read-only on this page; ownership and purchase
  flow belong to a future billing feature.
- **Testimonial**: A displayed quote — student name, track, and the specific improvement named.
  Static content for this page; not fetched from `writing_attempts`/`grader_results` history.
- **FAQ teaser item**: A question and its answer, exactly three of them, independent
  expand/collapse state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An unauthenticated visitor can state the product's purpose after reading only the
  hero, without scrolling or navigating away, in a usability check.
- **SC-002**: A sign-up action is reachable within one scroll from any point on the page, verified
  at the hero and at the final CTA band.
- **SC-003**: 100% of visitors surveyed in a usability check correctly identify that Writing is
  usable now and Speaking is not, after viewing the focus-area section alone.
- **SC-004**: 100% of statements on the page describing what the product does (How It Works,
  Comparison, stat cards, pricing feature lists) are verifiably true against
  001-ielts-score-assessment's actual shipped behavior at the time of each review.
- **SC-005**: 100% of navigation and footer links either lead to a real destination or are
  visibly marked as unavailable — zero silent dead ends in a link-audit pass.
- **SC-006**: A visitor comparing the four pricing plans can identify the recommended plan and
  correctly state which plan(s) include a future (not-yet-usable) Speaking entitlement, in a
  usability check.
- **SC-007**: The FAQ teaser's three items expand and collapse independently with no navigation
  away from the page, verified for all three.

## Assumptions

- **Design source**: Figma file `writewise` (`JGr2ZuKKC8JEiAIHzNAFLH`), the single-page desktop
  frame at node `1001:2`, read 2026-08-21. Mobile/responsive behavior was not present as a
  separate design and is assumed to follow standard responsive stacking.
- **FAQ answer copy** is not yet drafted anywhere (the source design shows three questions with no
  answer content). Writing that copy is a content task for the product owner, informed by
  001-ielts-score-assessment's actual behavior (per User Story 6's acceptance scenarios), not an
  engineering unknown this spec needs to resolve.
- **The General Training conflict is unresolved** — see the flagged callout above. FR-018/FR-019
  assume the smallest-change default (mark unsupported tracks as "coming soon") until the product
  owner decides otherwise.
- **The literal Yearly/Lifetime prices from the design (`$49.9`, `$149.9`) are treated as
  needing confirmation, not as final values** — see Edge Cases and User Story 4 scenario 4.
- **This spec does not cover**: the standalone FAQ page, the learner workspace, or the profile
  page — all three were part of this directory's original (superseded) scope and now have no
  spec. The workspace is expected to be covered by a future mock-test-experience spec (per
  `specs/README.md`); FAQ and profile currently have no planned spec.
- **This spec does not cover** the full mock-test experience (Task 1 + Task 2 timed sitting) that
  the design's "Simple process" language and this constitution's roadmap both anticipate — that
  remains a separate, not-yet-written feature, matching User Story 6 scenario 3's boundary.
- **Sign-up/sign-in mechanics themselves** (what happens after a CTA is clicked) belong to the
  Supabase-platform authentication feature, not this spec — this page only requires that the
  actions exist, are reachable, and (for pricing) carry the selected plan forward.
