<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0
- Modified principles:
  - I. Rubric-Grounded Scoring (NON-NEGOTIABLE) → I. Rubric-Grounded, Explainable Scoring (NON-NEGOTIABLE) [scope narrowed to feature 1a, kept]
  - II. Golden-Set Test-First → split into IV. Evaluation-Driven Methodology Changes (dataset/hypothesis-test/config gate) + III. Test-First Development (general app TDD, now explicit and NON-NEGOTIABLE)
  - III. Actionable Transparent Feedback → II. Teach-to-Improve Guidance (redefined as the step-by-step rewriting/teaching feature, not just score commentary)
  - IV. Simplicity & Incremental Delivery (YAGNI) → VI. Simplicity & Reusable Design (reframed to require design patterns/SOLID for reuse while still forbidding speculative abstraction)
  - V. Learner Data Privacy → folded into VII. Observability, Error Handling & Security by Default (no longer a standalone principle)
- Added principles: V. Cost-Conscious LLM Usage
- Added sections: Technology & Architecture Constraints (replaces "Additional Constraints & Quality
  Standards" with concrete stack/deployment decisions); Development Workflow & Quality Gates updated
  with TDD, evaluation, and security gates.
- Removed sections: none
- Rationale for MAJOR bump: principle set was redefined and reorganized around confirmed product
  scope and a fixed tech stack (Next.js/Vercel, FastAPI/Postgres/cloudflared, OpenRouter), not just
  clarified — this is a backward-incompatible redefinition of the v1.0.0 principle set.
- Deferred TODOs: none

---

- Version change: 2.0.0 → 2.0.1
- Modified principles: none
- Modified sections: Technology & Architecture Constraints — updated the frontend design-reference
  pointer from the placeholder `stitch_ielts_writing_diagnostic` mockup to the real, approved
  design set (`stitch_writewise_ielts_editorial_saas`, product name **WriteWise**), which
  `002-core-app-ux` had already adopted in its own spec/plan without a corresponding constitution
  update (flagged as a CRITICAL constitution-alignment gap by `/speckit-analyze`).
- Added principles: none
- Added sections: none
- Removed sections: none
- Rationale for PATCH bump: corrects a stale reference to match already-approved, already-built-
  against reality; no principle was redefined or expanded.
- Deferred TODOs: none

---

- Version change: 2.0.1 → 3.0.0
- Trigger: the self-hosted FastAPI + PostgreSQL + cloudflared backend is being retired in favour of
  Supabase (Auth + Postgres + Storage + Realtime + Edge Functions) as the platform of record, and a
  Speaking feature requiring an ASR service is now a planned part of the product roadmap.
- Modified principles:
  - I. Rubric-Grounded, Explainable Scoring — text unchanged, but now qualified by the new
    **Transitional Provisions** section (TP-1), which suspends the explanation requirement for the
    duration of the platform-migration phase under a named exit condition.
  - III. Test-First Development — expanded: TDD now explicitly covers Edge Functions, RLS policies,
    and column-level grants, because authorization moved out of application code and into the
    database, where an untested policy is a silent data leak rather than a failing endpoint.
  - IV. Evaluation-Driven Methodology Changes — expanded: adds the production-to-golden-set feedback
    loop, since the 10-sample golden dataset is too small to justify methodology changes alone.
  - V. Cost-Conscious LLM Usage — expanded: adds mandatory per-user rate limiting, since compute is
    now publicly reachable rather than sitting behind a private tunnel.
  - VII. Observability, Error Handling & Security by Default — REDEFINED (the backward-incompatible
    change driving this MAJOR bump). "Auth/authz is owned and enforced by the backend" no longer
    holds: there is no backend to own it. Authorization is now enforced by Postgres RLS and
    column-level grants. The blanket "all services MUST be dockerized" mandate is withdrawn (most
    compute is now serverless). Adds handling requirements for voice data and third-party
    processors, which the previous text-only product did not need.
- Added principles: VIII. Database-Mediated Compute (NON-NEGOTIABLE) — the frontend talks only to
  Supabase; long-running work is dispatched through a database job state machine, never by the
  client calling a compute endpoint directly. This is what lets the planned ASR/Speaking service be
  added as a new consumer rather than a frontend rewrite.
- Added sections: Transitional Provisions (new, with TP-1 governing the Principle I suspension).
- Modified sections: Technology & Architecture Constraints — rewritten around Supabase and a
  two-tier compute model (serverless for short work, container worker for long/Python/GPU work);
  the `stitch_writewise_ielts_editorial_saas` design reference is demoted from source of truth to
  historical reference, pending the forthcoming UI/UX specification; product scope updated from
  single-essay scoring to full mock test (Task 1 + Task 2 + timer).
- Removed sections: none
- Rationale for MAJOR bump: Principle VII — a NON-NEGOTIABLE principle — was redefined in a way
  that invalidates conforming implementations under v2.x (backend-owned auth, mandatory Docker for
  every service), and the fixed stack the v2.0.0 principle set was organized around has been
  replaced. Existing specs 001, 002, and 003 do not satisfy this version without revision.
- Numbering note: Principles I-VII keep their roman numerals deliberately. `specs/001-*/plan.md`,
  `specs/002-*/plan.md`, and `backend/pipelines/v1.yaml` cite principles by numeral; renumbering
  would silently break every one of those references. The new principle is appended as VIII.
- Deferred TODOs: none
-->

# IE Writing Constitution

## Core Principles

### I. Rubric-Grounded, Explainable Scoring (NON-NEGOTIABLE)
Every band score MUST be traceable to the official IELTS descriptors (for Writing: Task
Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy), with
per-criterion sub-scores and a stated rationale for *why* that score was given. No score without
an explanation.

**Currently suspended under TP-1** — see Transitional Provisions. The suspension is time-boxed and
carries a named exit condition; it does not repeal this principle.

**Why**: explainability of the verdict is the product's first core feature and the basis for user trust.

### II. Teach-to-Improve Guidance
The guidance feature MUST turn a learner's own weak ideas/sentences (from their actual assessment,
not generic tips) into strong ones through step-by-step, teacher-style scaffolding tied to the
specific rubric weaknesses found in Principle I.

**Why**: this is the second core feature — coaching beginners, not just grading them.

### III. Test-First Development (NON-NEGOTIABLE)
Application code follows red-green-refactor: write a failing test, then implement. No feature is
"done" without tests written first. This covers, at minimum:

- **Edge Functions** — request validation, LLM response parsing, error paths, and the job state
  transitions they perform.
- **RLS policies and column-level grants** — every policy MUST have a test proving both that the
  owner CAN perform the action and that a *different* authenticated user CANNOT. Score columns
  MUST have a test proving an authenticated user cannot write to them.
- **Frontend** — component and end-to-end tests for the flows a learner actually performs.

**Why**: explicit user requirement; keeps a solo-maintained SaaS regression-safe. The RLS clause is
not a formality — with authorization moved into the database, an untested policy fails silently as
a data leak rather than loudly as a broken endpoint.

### IV. Evaluation-Driven Methodology Changes
Any change to the scoring pipeline (prompt, model, rubric text, or aggregation logic) MUST be run
as a hypothesis test against the golden dataset before/after, with the pipeline configuration
captured in a versioned YAML file (prompt version, model, params) and results stored as JSON
artifacts for comparison. Every stored score MUST record the `pipeline_version` and `model_id` that
produced it, so any score can be traced back to its methodology.

The golden dataset MUST grow from production data. Real submissions that the production logs show
as low-confidence, failed, or anomalous are candidate additions; a dataset small enough to overfit
against is not a sufficient basis for a methodology change.

**Why**: scoring quality is empirical, not assumed — every methodology change must show its effect
on real data, and a ten-sample dataset cannot carry that burden alone.

### V. Cost-Conscious LLM Usage
LLM and ASR calls go through a model-agnostic interface; the model is a config value (Principle
IV's YAML), never hardcoded. Batch or reduce calls per assessment wherever the golden dataset shows
no quality loss.

Every publicly reachable endpoint that triggers a paid call MUST enforce a per-user rate limit, and
per-call cost MUST be recorded (see Principle VII).

**Why**: explicit budget constraint — score accuracy must be earned per API call, not assumed. The
rate-limit clause exists because compute is now publicly reachable: without it, one user can drain
the entire budget.

### VI. Simplicity & Reusable Design
Use clear interfaces and standard design patterns/SOLID so components (scoring, guidance, ASR,
dashboard) stay reusable and upgradable later, but do not add abstraction, services, or models
speculatively — only when a concrete current need or a golden-set/spec shortfall justifies it.

Compute tiers (see Technology & Architecture Constraints) are added when a workload demonstrably
does not fit the tier below it, not in anticipation.

**Why**: balances "built to last" with YAGNI so a solo project doesn't drown in premature architecture.

### VII. Observability, Error Handling & Security by Default (NON-NEGOTIABLE)

**Authorization.** Authorization is owned and enforced by the database. Every table holding learner
data MUST have Row Level Security enabled and policies scoped to `auth.uid()`. Any column whose
value must not be self-assigned by a learner — band scores, job status, entitlements — MUST be
protected by a column-level grant revoking write access from the `authenticated` role, not merely
by client-side discipline. The `service_role` key MUST NOT reach any client bundle; any code
holding it bypasses RLS entirely and therefore MUST re-verify ownership itself rather than trusting
identifiers supplied by the caller.

**Observability.** Every paid or fallible call MUST be recorded durably in the project's own
database — at minimum: pipeline version, prompt version, model id, status, latency, token counts,
cost, retry count, and the raw provider response. Platform-provided logs are a debugging aid, not
the system of record; their retention is short and they cannot be joined against learner data.

**Learner data.** Essays and audio are used only to produce the requested evaluation and are kept
only as long as needed. Voice recordings are more sensitive than text and MUST have a stated
retention period and deletion path. Raw learner content captured for observability MUST be purged
on a defined schedule; the derived operational metrics, which contain no personal data, may be kept
indefinitely.

**Third-party processors.** Sending learner content to any external provider (LLM, ASR, or other)
is a data-sharing decision that MUST be stated explicitly in the feature's specification — which
provider, what content, what retention. It MUST NOT be an unstated implementation detail.

**Why**: this is a SaaS handling real user data on publicly reachable infrastructure. Moving
authorization into the database removed the application layer that used to guard it, which makes
the policy layer itself the security boundary — and makes durable, queryable evidence of what the
system did the only way to diagnose it after the fact.

### VIII. Database-Mediated Compute (NON-NEGOTIABLE)
The frontend communicates with Supabase and nothing else. It MUST NOT call a compute endpoint
directly to perform long-running work.

Work is dispatched by writing intent to the database — a row with a `status` field — and observed
by watching that row change. Which compute tier services that row, and where it runs, is invisible
to the client. Compute components MUST be replaceable without any frontend change.

**Why**: this is the seam that keeps the roadmap additive. The planned Speaking/ASR feature, and
any later move of the scoring pipeline to a heavier worker, become *new consumers of an existing
job table* rather than new frontend integrations with new endpoints, new CORS surfaces, and new
places to hold a secret. Coupling the client to compute endpoints is the decision that would be
expensive to reverse; this principle forbids making it.

## Technology & Architecture Constraints

**Platform of record — Supabase.** Authentication, PostgreSQL, Storage, Realtime, and Edge
Functions. This is the fixed centre of the architecture: it holds all state and is the only host
the frontend addresses. The previous self-hosted FastAPI + PostgreSQL + `cloudflared` backend is
retired.

**Frontend.** Next.js, deployed on Vercel. Product name **WriteWise**. The
`stitch_writewise_ielts_editorial_saas` design set is retained as historical reference only; it is
no longer the source of truth for layout and visual design, pending the forthcoming UI/UX
specification that supersedes `002-core-app-ux`.

**Compute — two tiers, added in order.** A workload belongs to the lowest tier that fits it:

| Tier | Runtime | For |
|---|---|---|
| 1 | Supabase Edge Functions (Deno/TypeScript) | Short work (seconds): scoring calls, orchestration, ASR of short audio segments |
| 2 | Container worker (Railway / Fly / Modal or similar) | Long, Python-dependent, or GPU-dependent work: full explanation-generating pipeline, pronunciation analysis, self-hosted ASR |

Tier 2 MUST NOT be introduced until a workload is shown not to fit Tier 1 (Principle VI). When it
is introduced, it consumes the same job table as Tier 1 (Principle VIII) and ships with a
Dockerfile.

**Local environment.** The local checkout is an evaluation and prompt-engineering workbench, not a
runtime: it hosts the golden dataset, versioned pipeline configs, prompt/rubric text, and the
benchmark harness required by Principle IV. It serves no user traffic.

**Product scope.** The Writing product is a **full mock test** — Task 1 and Task 2 completed in one
timed attempt, scored per task against that task's descriptors and combined using the official
weighting (Task 1 one third, Task 2 two thirds). A **Speaking** feature built on ASR is a planned
future addition; the data model and job contract MUST leave room for it without requiring a
migration of existing attempt data. The progress-tracking dashboard remains an explicit bonus
feature and MUST NOT block or delay core scoring work.

**Secrets.** Provider keys (OpenRouter, ASR) and the Supabase `service_role` key are never
committed and never exposed to a client bundle; they are injected as environment/secret config into
the compute tier that needs them. The Supabase `anon` key is public by design and is not a secret —
it is safe in the client precisely because RLS, not key secrecy, is the access-control mechanism
(Principle VII).

## Development Workflow & Quality Gates

- Features go through the Spec Kit flow (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`). Scoring and guidance features MUST address golden-set impact and data
  handling in the spec itself. Any feature sending learner content to a third party MUST name that
  provider in the spec (Principle VII).
- Database schema changes MUST ship as migration files in the repository, reviewed alongside the
  code that depends on them. Changes applied only through the Supabase dashboard are not
  reproducible and do not satisfy this gate.
- A change is not done until: tests were written first and pass, including RLS policy tests (III);
  any methodology change has a documented before/after golden-set hypothesis test (IV); every paid
  call is recorded and every publicly reachable paid endpoint is rate-limited (V, VII); and the
  frontend gained no direct dependency on a compute endpoint (VIII).
- New services, models, abstractions, or compute tiers must cite the specific need or shortfall that
  justifies them per Principle VI, in the plan, before implementation.

## Transitional Provisions

Provisions in this section are temporary, apply only to the phase they name, and each carries an
exit condition. A provision that has met its exit condition MUST be removed in the next amendment.
Deviations covered by an active provision are justified and non-blocking; deviations outside one
remain blocking under Governance.

### TP-1 — Principle I suspended during platform migration

**Status**: Active. Opened 2026-08-21.

**Scope of suspension.** During the platform-migration phase, a scored attempt MAY persist band
scores without a per-criterion explanation. This exists because the migration's goal is to prove
the Supabase platform, auth, job dispatch, and end-to-end flow are stable, and carrying the full
explanation-generating pipeline through that migration would couple two independently risky changes.

**Constraints while active.** All of the following hold:

1. Every scored attempt MUST still record `pipeline_version` and `model_id` (Principle IV is NOT
   suspended).
2. The stored score shape MUST be forward-compatible — adding explanations later MUST NOT require
   migrating or discarding attempts scored during this phase.
3. Scores produced during this phase MUST be presented to learners as provisional, and MUST NOT be
   sold, advertised as diagnostic feedback, or included in a paid tier.
4. No public launch while this provision is active.

**Exit condition.** This provision closes when per-criterion explanations, grounded in the official
descriptors and anchored to the learner's own text, are produced by the scoring pipeline and
persisted (for example, in a dedicated feedback table) — restoring Principle I in full.

**Review.** Re-examined at each constitution amendment. If still active after the platform
migration is complete, the amendment MUST record why.

## Governance

This constitution supersedes any conflicting informal practice. Amendments are made by editing this
file and MUST include a Sync Impact Report (HTML comment at the top) describing the version change
and what changed.

Versioning: MAJOR for backward-incompatible principle removal/redefinition, MINOR for a new
principle or materially expanded guidance, PATCH for wording/clarification only.

Principles are cited by roman numeral throughout the specs and pipeline configs. Numerals I-VIII
are stable identifiers: existing principles MUST NOT be renumbered, and a retired principle's
numeral MUST NOT be reused. New principles are appended.

All specs, plans, and task lists MUST be checked against this constitution before
`/speckit-implement` proceeds; unjustified deviations from Principles I, III, VII, or VIII are
blocking, not advisory. A deviation covered by an active Transitional Provision is justified, and
MUST cite the provision by identifier in the plan's Constitution Check.

**Version**: 3.0.0 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-21
