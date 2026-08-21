# Phase 0 Research: WriteWise Landing Page

The Figma-grounding work that produced [spec.md](./spec.md) already resolved most design-content
questions (exact copy, section order, pricing figures). This file resolves what's left: how the
*existing* frontend code (built against the retired four-surface, Stitch-based version of this
spec) relates to the rewrite, and the implementation-level decisions the spec didn't need to make.

## R1. What in the existing `frontend/` tree survives the rewrite

**Finding**: `frontend/src/app/page.tsx` and every component under `frontend/src/components/landing/`
(`Hero`, `ProblemSection`, `ComparisonTable`, `HowItWorksStep`, `PricingCard`, `ExpertReviewCard`,
`LearnerReviewCard`, `FinalCta`) were built against the **old** spec — different headline
("Know exactly why your IELTS essay scored what it did" vs. the Figma design's "Master your IELTS
Writing with AI-powered feedback"), different CTA copy, no focus-area/Speaking-teaser section at
all, and explicitly-labelled placeholder testimonials ("Illustrative expert quote — placeholder").
None of this is wrong — the code's own comments show it was a careful, deliberate response to the
Stitch mockup and the constraints active at the time (e.g. `pricing.ts`'s comment explains why its
numbers deliberately diverge from that mockup's placeholders). It is simply answering a spec that
no longer exists.

**Decision**: Treat this as a **content and structure rewrite of the existing component tree**, not
a from-scratch rebuild and not an incremental patch:

- **Rewrite in place** (same file, new content/props): `Hero.tsx`, `ComparisonTable.tsx`,
  `HowItWorksStep.tsx`, `PricingCard.tsx` + `lib/pricing.ts`, `FinalCta.tsx`, `SiteHeader.tsx`,
  `SiteFooter.tsx`. The component *shape* (props-driven cards, Tailwind design tokens already in
  use — `text-display-lg`, `bg-primary`, etc.) is reusable; the copy and, for `PricingCard`, the
  tier data are not.
- **Replace outright**: `ExpertReviewCard.tsx` + `LearnerReviewCard.tsx` become one
  `TestimonialCard.tsx` — the design has one testimonial shape (name, track, quote), not two
  separate expert/learner variants.
- **Add new** (no prior equivalent): a focus-area selector section (Writing/Speaking, spec.md
  FR-004..FR-006), a "Why WriteWise" stats section (FR-009), and a FAQ teaser section (FR-020).
- **`ProblemSection.tsx`**: superseded by the Comparison section's real content: the old component
  doesn't map to any one section in the new design. Retired.

**Rationale**: Constitution Principle VI forbids both premature rebuilding (the Tailwind
token/prop-shape conventions already work and a second design pass shouldn't reinvent them) and
forcing old content to survive a redesign it doesn't fit. The dividing line here is content vs.
structure: where the *shape* still fits the new design, keep the file and change its content;
where the new design has no equivalent shape (two review-card variants → one; a whole new
focus-area concept), the component boundary itself changes.

## R2. The General Training conflict — resolved for planning purposes as spec.md documents

**Finding**: The tension flagged in spec.md (design references General Training; 001's grader
doesn't support it) is **not new** — `frontend/src/lib/faqData.ts`'s own header comment
independently documents correcting a *different* General-Training-adjacent inconsistency in the
old FAQ mockup, and one of its still-live answers ("Who is it for?") describes the product as
serving "IELTS Academic or General Training Writing" — the same unresolved framing, arrived at
independently, in a completely different content file. This corroborates that it's a real,
recurring product-scope question, not an artifact of one design file.

**Decision for this plan**: proceed under spec.md's documented default (Option 2 — links/mentions
of unsupported tracks render as "coming soon" rather than removed or fully built), exactly as the
spec's flagged callout states. `data-model.md`'s `NavLink`/`FooterLink` shape carries an
`available: boolean` field for exactly this reason. This is **not** re-opening the question the
spec already deferred to the product owner — it's the minimum needed to make the page ship
without a broken or misleading link in the meantime.

## R3. Pricing figures — carry the flagged uncertainty forward, don't silently fix it

**Finding**: The existing (pre-rewrite) `lib/pricing.ts` independently arrived at `"$49.9"` for its
Yearly tier — the same one-decimal-place figure the new Figma design shows, though the two files
reached it independently and disagree on Lifetime (`$99` in the old code vs. `$149.9` in the new
design). Two independent sources landing on the same odd figure for Yearly, but not for Lifetime,
does not resolve whether `$49.9` is deliberate or a placeholder — if anything it shows the
uncertainty has been silently carried forward once already.

**Decision**: `lib/pricing.ts` is rewritten to match the new design's four tiers and features
exactly as designed (`$0` / `$4.99` / `$49.9` / `$149.9`), with the file-level comment stating
plainly that the Yearly/Lifetime figures are transcribed as-designed and flagged for product-owner
confirmation (spec.md Edge Cases) — not silently "corrected" to `$49.99`/`$149.99` a second time
without that confirmation actually happening.

## R4. CTA destinations: `/signup` and `/signin` exist, but their wiring is dead

**Finding**: `frontend/src/lib/auth.ts` and the `/signup`, `/signin` pages already exist in the
frontend tree, built against `003-account-authentication`'s `/api/v1/auth/*` HTTP contract. That
backend is retired (constitution v3.0.0) and its Supabase-platform replacement is not yet built
(`specs/README.md`: "Planned"). Clicking "Get started" today reaches a real page that will fail at
the network call.

**Decision**: This is out of scope to fix here — spec.md's own Assumptions are explicit that
sign-up/sign-in mechanics belong to the Supabase-platform feature, and this page only needs the
actions to exist and be reachable. The CTAs link to `/signup`/`/signin` unchanged. This is recorded
as a **known, explicit limitation** (quickstart.md states it directly) rather than left for someone
to discover by clicking — the gap is real and worth being honest about even though closing it is
someone else's feature.

**Alternatives considered**: Building a minimal Supabase-backed stub sign-up flow as part of this
feature. Rejected — that is the Supabase-platform feature's job in full (session handling, RLS,
column grants), and building a throwaway stub here means throwing it away again shortly, which is
exactly the kind of premature/duplicated work Principle VI warns against.

## R5. A single "unavailable" link/card treatment, not four ad hoc ones

**Finding**: Spec.md requires this same "don't imply it works" treatment in four places: the
Speaking focus-area card (FR-006), General Training nav/footer links (FR-018), footer resource
links with no destination yet (FR-019), and (per constitution TP-1) any overclaiming language near
the stat cards (FR-009).

**Decision**: One shared presentational pattern — a disabled-style `Link` variant (muted color,
`aria-disabled`, a small "Coming soon" badge, and either no `href` or an inert one) used
consistently everywhere FR-006/FR-018/FR-019 apply, rather than four separate ad hoc
implementations that could drift in how "unavailable" is signalled. FR-009's concern (stat-card
wording) is a copy discipline, not a component — no shared component needed there.

## R6. FAQ teaser content — partially reusable, not a blank page

**Finding**: `frontend/src/lib/faqData.ts` already has vetted (if since-superseded-in-places)
answers close to two of the landing teaser's three questions: `"accuracy"` ("How accurate is it?")
and `"task-types"` ("Which task types are supported?") map directly onto spec.md's first two
teaser questions. The third — "Will I understand why I got a certain score?" — is closest to
`"how-scoring-works"`, but that entry's wording ("quotes taken verbatim from your essay") describes
the **retired four-call pipeline's** evidence-quoting design, not 001's current single-call grader
(band + bilingual comment; verbatim-quote verification is exactly what constitution TP-1 still
leaves open). Reusing that wording verbatim would make the new landing page's own FR-011 (no claim
here may overstate a capability the product doesn't have) false the moment it shipped.

**Decision**: The landing teaser's three answers are **adapted from**, not copy-pasted from,
`faqData.ts` — first two lightly reworded for the shorter teaser format, the third written fresh
against 001's actual current FR-013..FR-016. This closes spec.md's "content gap" more cheaply than
its own Assumptions section implied (it isn't a from-scratch copywriting task), while avoiding
quietly re-publishing a claim 001's own rewrite already retired. Whether `faqData.ts` itself gets a
matching refresh pass is out of this feature's scope (the standalone `/faq` page has no owning
spec right now, per `specs/README.md`) — noted here so it isn't lost, not fixed here.

## R7. Testing approach

**Decision**: Reuse the existing tooling unchanged — Vitest + Testing Library for component-level
tests (`frontend/tests/unit/landing/*.test.tsx`, one file per rewritten/new component, following
the existing naming convention), Playwright for the page-level flow
(`frontend/tests/e2e/how-it-works.spec.ts` and a new `frontend/tests/e2e/landing-page.spec.ts`
covering the sections this rewrite adds).

`frontend/tests/e2e/discover-and-signup.spec.ts` and `profile-signout.spec.ts` currently stub
`003`'s retired `/api/v1/auth/*` contract (per `playwright.config.ts`'s own comment about
network-boundary stubs shaped from the real OpenAPI documents). Per R4, fixing their stubs is the
Supabase-platform feature's job, not this one's — they are left as-is and flagged, not silently
adjusted to a contract shape that isn't built yet either.

**Alternatives considered**: A visual-regression tool (e.g. Chromatic) to catch drift against the
Figma design directly. Rejected for this feature per Principle VI — no such tooling exists in this
project today, and introducing it is a bigger commitment than one redesigned page justifies; the
Figma screenshots already captured during spec-writing are a sufficient manual reference for this
pass.

## Summary of what Phase 1 builds on

- A rewritten `PricingPlan` shape (`lib/pricing.ts`) matching all four real tiers, including the
  `speakingIncluded` flag FR-015 requires.
- A new `NavLink`/`FooterLink` shape carrying `available: boolean`, driving the single
  disabled-link treatment from R5.
- A `Testimonial` shape unifying the old expert/learner split into one.
- A `FaqTeaserItem` shape for the three inline Q&A entries, with answers adapted per R6.
- No database, no new API — every entity here is static, in-code content (spec.md's Key Entities
  section already says as much); `data-model.md` documents shapes, not schema.
