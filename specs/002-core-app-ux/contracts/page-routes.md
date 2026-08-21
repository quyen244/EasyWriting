# Page Contract: WriteWise Landing Page

This feature adds no HTTP API — its "contract" is the route it owns, the anchors within it, and
which other features' routes/APIs it depends on without owning them. Same UI-contract format the
original version of this spec used, narrowed to one route.

## Route this feature owns

| Route | Access | Notes |
|---|---|---|
| `/` | Public | The entire feature. Single scrolling page; sections are anchor-addressable (`/#how-it-works`, `/#pricing`) for the header nav and hero secondary CTA (FR-002, FR-003) |

## Outbound dependencies (this feature links to them; does not implement them)

| Target | Owned by | Status | What this feature requires of it |
|---|---|---|---|
| `/signup`, `/signin` | Supabase-platform auth feature (**Planned**, not yet built) | Pages exist in the frontend tree today, wired to the retired `003` FastAPI contract — will error on submit until the Supabase-platform feature ships (research.md R4) | Only that the routes exist and are reachable (FR-002, FR-003, FR-021). This feature does not fix their internal wiring. |
| `/faq` | No owning spec (lost its spec home when this feature narrowed — `specs/README.md`) | Exists, currently functional, built against `faqData.ts` | Reachable as a nav link, unchanged. This feature's own inline FAQ teaser (FR-020) is a separate, smaller thing — three questions on this page itself, not a link to `/faq`. |
| 001-ielts-score-assessment's grader | `001-ielts-score-assessment` (Active) | Built, not yet deployed | Referenced only by description (the How-It-Works and focus-area copy must match its actual behavior — FR-008, FR-011). No direct call from this page. |
| Academic / General Training track links | Undecided — see spec.md's flagged callout | N/A | Pending the product owner's decision; default rendered per FR-018 (`available: false` if unsupported) |
| Blog, Practice Tests, Band Calculators, About Us, Contact, Privacy Policy | No owning feature | Do not exist | Rendered `available: false` (FR-019) — see `data-model.md`'s `FooterLink` shape |

## Anchor behavior

```
"How it works" (hero secondary CTA, nav item)  -> scrolls to #how-it-works, no navigation
"Pricing" (nav item)                            -> scrolls to #pricing, no navigation
"Get started" / "Join now" / final-CTA button   -> navigates to /signup
"Login" (nav item)                              -> navigates to /signin
Any plan's "Get started" (pricing cards)         -> navigates to /signup, carrying the plan
                                                    identity forward (FR-016) — e.g. a query
                                                    param (`/signup?plan=yearly`), since there is
                                                    no backend yet to hand a plan id to
```

## What this feature does NOT expose

- No API route. No server action. No new environment variable. Everything here is static content
  rendered by the Next.js app already deployed — this page adds no new server-side dependency
  Principle VIII would need to account for.
- No database read/write. `data-model.md`'s shapes are compiled into the bundle, not fetched.
