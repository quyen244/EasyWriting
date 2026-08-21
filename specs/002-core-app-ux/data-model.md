# Phase 1 Data Model: WriteWise Landing Page

This feature has no database and no API of its own — spec.md's Key Entities section is explicit
that every entity here is static, in-code content. What follows are the TypeScript shapes that
content takes, not a schema. All shapes live under `frontend/src/lib/`.

## Plan (`lib/pricing.ts`)

The four pricing tiers (spec.md FR-012..FR-016).

| Field | Type | Notes |
|---|---|---|
| `name` | `"Free" \| "Monthly" \| "Yearly" \| "Lifetime"` | Fixed set — exactly four (FR-012) |
| `price` | `string` | Display string, e.g. `"$4.99"`. Yearly/Lifetime carry the as-designed, flagged-for-confirmation figures (research.md R3) |
| `cadence` | `string?` | e.g. `"/mo"`, `"/yr"`; absent for Free and Lifetime |
| `badge` | `string?` | e.g. `"START HERE"`, `"POPULAR"`, `"RECOMMENDED"`, `"PAY ONCE"` — display-only, distinct from `recommended` |
| `recommended` | `boolean` | Exactly one plan is `true` (FR-013) — a check constraint in spirit, enforced by a unit test (quickstart.md), since there is no database to constrain it |
| `features` | `string[]` | Bullet list as designed |
| `speakingIncluded` | `boolean` | Drives FR-015's "forward-looking entitlement" treatment — `true` for Yearly/Lifetime only |
| `cta` | `string` | Button label |

**Validation rules**:

- Exactly 4 plans, exactly 1 with `recommended: true` — asserted in a unit test, since nothing
  else in a static array enforces it.
- The Free plan's `features` MUST describe an actual scored result (not a "preview" or "demo"
  wording) — FR-014.
- Any plan with `speakingIncluded: true` MUST have that surfaced in the UI with the "not usable
  yet" qualifier (FR-015) — not just present in the data.

## NavLink / FooterLink (`lib/navigation.ts`)

Drives the persistent nav (FR-003), the focus-area cards' link behavior (FR-005/FR-006), and
footer links (FR-019), sharing one `available` flag so "coming soon" rendering is one code path
(research.md R5).

| Field | Type | Notes |
|---|---|---|
| `label` | `string` | |
| `href` | `string?` | Absent (or inert) when `available: false` |
| `available` | `boolean` | `false` renders the shared disabled/"coming soon" treatment regardless of which section uses this shape |

**Validation rules**:

- Every footer/nav entry pointing at a page that does not exist yet (Blog, Practice Tests, Band
  Calculators, About Us, Contact, Privacy Policy, and — pending the General Training decision —
  that track's link) MUST have `available: false` (FR-019). A unit test enumerates the footer/nav
  content and asserts no `available: true` entry's `href` 404s within the app's own route table.
- The Speaking focus-area entry MUST have `available: false` (FR-006).

## Testimonial (`lib/testimonials.ts`)

Replaces the old `ExpertReview`/`LearnerReview` split (research.md R1) with one shape, since the
design has one testimonial card type.

| Field | Type | Notes |
|---|---|---|
| `quote` | `string` | Must name a specific improvement area, not generic praise (FR-017) |
| `name` | `string` | |
| `track` | `"Academic" \| "General Training"` | See constraint below |

**Validation rules**:

- A `track: "General Training"` testimonial MUST NOT be displayed unless/until the General
  Training decision (spec.md callout) resolves in favour of supporting it — until then, per the
  documented default, this entity's General Training entry is held out of the rendered set rather
  than displayed as if the track were supported (FR-018). This is a stricter reading than "mark
  the nav link coming soon" — a testimonial attributes a claim to a named person, which is a
  different (and higher) bar than a disabled nav link.

## FaqTeaserItem (`lib/faqTeaser.ts`)

The three inline Q&A entries (FR-020) — a small, separate module from the existing
`lib/faqData.ts` (which backs the standalone `/faq` page, out of this feature's scope), per
research.md R6.

| Field | Type | Notes |
|---|---|---|
| `question` | `string` | One of the three fixed questions from spec.md §User Story 6 |
| `answer` | `string` | Adapted from `faqData.ts` where a safe match exists, written fresh where it doesn't (research.md R6) |

**Validation rules**:

- Exactly 3 items (FR-020).
- The explainability answer MUST NOT claim machine-verified verbatim quoting — a unit test greps
  for language like "verbatim" / "exact quote" and fails if present, since that specific overclaim
  is the one research.md R6 identified as already having leaked into `faqData.ts` once.

## Section content modules (no shared shape — one interface each)

- `HowItWorksStep` (existing shape, content rewritten): exactly 3 steps — Analyze, Evaluate
  Criteria, Score & Improve (FR-007) — the middle one's description MUST name all four official
  criteria (FR-008).
- `StatCard` (new, `lib/whyWriteWise.ts`): the four "Why WriteWise" cards — `stat` (e.g. `"+1.5"`),
  `title`, `caption`. No entity relationships; each card's `caption` is checked against FR-009's
  "illustrative, not promised" requirement by editorial review, not by a runtime rule.

## Relationships

None of these shapes reference each other or any backend entity by ID — this is the defining
difference from `001`'s and the Supabase-platform feature's data models, which are relational and
RLS-scoped. The only "relationship" here is human-maintained consistency:

- `Testimonial.track` must stay consistent with whatever the General Training decision resolves to.
- `Plan.speakingIncluded` must stay consistent with the focus-area section's Speaking
  `available: false` state — both describe the same real-world fact (Speaking isn't built yet)
  from two different sections of the page, and a future change to one without the other would
  silently reintroduce the FR-011 overclaim risk this spec exists to prevent.
