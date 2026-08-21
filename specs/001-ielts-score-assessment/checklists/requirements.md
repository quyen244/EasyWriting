# Specification Quality Checklist: IELTS Writing Mock Test Grader

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-21
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain — **3 open, see Notes**
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Constitution alignment

- [x] **I (Explainable Scoring)** — deviation covered by **TP-1** and cited; FR-028 keeps the
      result shape ready to carry explanations, FR-029 enforces the provisional-labelling and
      no-paid-tier constraints TP-1 imposes
- [x] **III (Test-First)** — FR-011's penalty/prompt pairing, FR-021/FR-022's ownership rules,
      and SC-007's determinism are each stated as testable propositions
- [x] **IV (Evaluation-Driven)** — FR-020, SC-006; FR-024's grading record supplies the
      production data Principle IV requires for growing the golden set
- [x] **V (Cost-Conscious)** — FR-023 (rate limit, no duplicate scoring), FR-024 (cost recorded),
      SC-011; consolidating four calls into one is a deliberate cost reduction
- [x] **VII (Security/Observability)** — FR-021, FR-022, FR-024, SC-010, SC-011
- [x] **VIII (Database-Mediated Compute)** — the spec describes the observable outcome and the
      `status` lifecycle without binding the client to a compute endpoint; dispatch is left to
      the plan

## Validation iterations

**Iteration 1** — issues found and fixed:

1. *Length handling was under-specified.* The original draft said a penalty is applied but not
   that the grading step must be told **not** to apply it too. The inherited implementation notes
   these are two halves of one arrangement that must stay in sync. Added as **FR-011**, because a
   silent break here double-penalises every under-length learner.
2. *Failure had no shape.* The result contract described only success, leaving each display to
   invent its own failure rendering — exactly the divergence this spec exists to prevent. Added
   the **Failure result** table and the explicit prohibition on substituting zeroes or blanks.
3. *Criterion labels were assumed uniform across tasks.* Position 1 is "Task Achievement" for
   Task 1 and "Task Response" for Task 2. A display assuming one label would mislabel half of
   every result. Added User Story 1 scenario 4, FR-002, and the codes-and-order table.
4. *"Off-scale band" was an edge case with no requirement behind it.* Added **FR-013**, including
   that the correction is recorded rather than hidden — it is a model-quality signal.
5. *Rounding was stated vaguely.* Replaced with **FR-006**'s explicit halfway-rounds-upward rule
   and worked examples, since ordinary rounding gets 6.25 wrong.

## Notes

Three clarifications are open. Each has a reasonable default proposed; none blocks reading the
spec, but all three change what gets built:

1. **Grading call granularity** — one call covering both tasks, or one per task. Affects cost and
   quality directly.
2. **Unattempted task** — what a blank task scores when the timer expires. The inherited band
   arithmetic floors at 1.0, while IELTS awards 0 for no attempt; the two disagree, so this
   cannot be resolved by following the existing code.
3. **Source of the exam questions** — Task Achievement and Task Response are unjudgeable without
   them, and no current attempt record carries them.

Resolve via `/speckit-clarify`, or answer directly, before `/speckit-plan`.
