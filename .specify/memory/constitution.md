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
-->

# IE Writing Constitution

## Core Principles

### I. Rubric-Grounded, Explainable Scoring (NON-NEGOTIABLE)
Every band score MUST be traceable to the official IELTS Writing descriptors (Task
Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy), with
per-criterion sub-scores and a stated rationale for *why* that score was given. No score without
an explanation.

**Why**: explainability of the verdict is the product's first core feature and the basis for user trust.

### II. Teach-to-Improve Guidance
The guidance feature MUST turn a learner's own weak ideas/sentences (from their actual assessment,
not generic tips) into strong ones through step-by-step, teacher-style scaffolding tied to the
specific rubric weaknesses found in Principle I.

**Why**: this is the second core feature — coaching beginners, not just grading them.

### III. Test-First Development (NON-NEGOTIABLE)
Application code (API endpoints, auth, dashboard, guidance logic) follows red-green-refactor:
write a failing test, then implement. No feature is "done" without tests written first.

**Why**: explicit user requirement; keeps a solo-maintained SaaS regression-safe.

### IV. Evaluation-Driven Methodology Changes
Any change to the scoring pipeline (harness, prompt, model, or reused logic from the IE AI
Evaluator project) MUST be run as a hypothesis test against the existing golden dataset before/after,
with the pipeline configuration captured in a versioned YAML file (prompt, model, params, etc.) and
results stored as JSON artifacts for comparison.

**Why**: scoring quality is empirical, not assumed — every methodology change must show its effect on real data.

### V. Cost-Conscious LLM Usage
LLM calls go through OpenRouter behind a model-agnostic interface; the model is a config value
(Principle IV's YAML), never hardcoded. Batch or reduce calls per assessment wherever the golden
dataset shows no quality loss.

**Why**: explicit budget constraint — score accuracy must be earned per API call, not assumed.

### VI. Simplicity & Reusable Design
Use clear interfaces and standard design patterns/SOLID so components (scoring, guidance,
dashboard) stay reusable and upgradable later, but do not add abstraction, services, or models
speculatively — only when a concrete current need or a golden-set/spec shortfall justifies it.

**Why**: balances "built to last" with YAGNI so a solo project doesn't drown in premature architecture.

### VII. Observability, Error Handling & Security by Default (NON-NEGOTIABLE)
All services MUST have structured logging, error handling, and monitoring usable both on the local
cloudflared-tunneled backend and after a future cloud migration. Auth/authz is owned and enforced
by the backend. Learner essay data is used only to produce the requested evaluation, kept only as
long as needed, and never shared beyond what evaluation requires. All services MUST be dockerized.

**Why**: this is a SaaS handling real user data behind a self-hosted tunnel — security, data
handling, and the ability to diagnose issues remotely are non-negotiable from day one.

## Technology & Architecture Constraints

- **Frontend**: Next.js, deployed on Vercel; product name **WriteWise**. UI follows the
  `D:\Projects\Assignment\LLM-AI-Assistant-Projects\ie_writing\stitch_writewise_ielts_editorial_saas`
  design reference (HTML mockups + `academic_editorial` design system) as the source of truth for
  layout and visual design, superseding the earlier `stitch_ielts_writing_diagnostic` placeholder.
- **Backend**: FastAPI + PostgreSQL, run on a local machine and exposed via Cloudflare Tunnel
  (`cloudflared`) on `rexsantech.com` during this phase, to control cost while the product is
  validated; migration to a managed host (e.g. Supabase, AWS) is a later, separate decision, not a
  default assumption baked into the code.
- **Scoring pipeline**: temporarily reuses the pipeline from the IE AI Evaluator project as its
  starting point, evolved under Principle IV rather than rewritten from scratch.
- **Feature priority**: score assessment (I) and teach-to-improve guidance (II) are the core
  product; the progress-tracking dashboard is an explicit bonus feature and MUST NOT block or
  delay the two core features.
- **Containerization & security**: every service ships with a Dockerfile; secrets (OpenRouter
  keys, DB credentials, auth secrets) are never committed and are injected via environment
  config for both local and future cloud deployment.

## Development Workflow & Quality Gates

- Features go through the Spec Kit flow (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`); scoring/guidance features MUST address golden-set impact and data handling
  in the spec itself.
- A change is not done until: tests were written first and pass (III), any methodology change has a
  documented before/after golden-set hypothesis test (IV), and new endpoints have logging/error
  handling and don't bypass backend-owned auth (VII).
- New services, models, or abstractions must cite the specific need or shortfall that justifies
  them per Principle VI, in the plan, before implementation.

## Governance

This constitution supersedes any conflicting informal practice. Amendments are made by editing
this file and MUST include a Sync Impact Report (HTML comment at the top) describing the version
change and what changed.

Versioning: MAJOR for backward-incompatible principle removal/redefinition, MINOR for a new
principle or materially expanded guidance, PATCH for wording/clarification only.

All specs, plans, and task lists MUST be checked against this constitution before
`/speckit-implement` proceeds; unjustified deviations from Principles I, II, III, IV, or VII are
blocking, not advisory.

**Version**: 2.0.1 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-20
