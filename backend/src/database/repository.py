"""Persistence for submissions and their results (T031).

Keeps SQLAlchemy out of the route handlers so the endpoint reads as the workflow it is
(validate -> score -> persist) rather than as ORM plumbing (Constitution VI).

Every write path here records a submission row, including rejected and failed attempts.
FR-009 requires that a failed attempt never costs the learner their text, and the
honest way to guarantee that server-side is to persist what they sent before anything
can go wrong with it.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from src.models import (
    AssessmentResult,
    EssaySubmission,
    RejectionReason,
    SubmissionStatus,
    TaskType,
)
from src.pipeline.pipeline import PipelineOutcome


def create_submission(
    db: Session,
    *,
    account_id: uuid.UUID,
    task_type: str,
    essay_text: str,
    word_count: int,
    status: SubmissionStatus,
    prompt_text: str | None = None,
    rejection_reason: RejectionReason | None = None,
    failure_detail: str | None = None,
) -> EssaySubmission:
    submission = EssaySubmission(
        user_id=account_id,
        task_type=TaskType(task_type),
        prompt_text=prompt_text,
        essay_text=essay_text,
        word_count=word_count,
        status=status,
        rejection_reason=rejection_reason,
        # Truncated: this is a diagnostic breadcrumb, not a log sink.
        failure_detail=failure_detail[:1000] if failure_detail else None,
    )
    db.add(submission)
    db.flush()
    return submission


def create_result(
    db: Session, *, submission: EssaySubmission, outcome: PipelineOutcome
) -> AssessmentResult:
    """Persist a scored outcome. Assumes `outcome.partial` is False (pipeline enforces)."""
    result = AssessmentResult(
        submission_id=submission.id,
        overall_band=outcome.overall_band,
        criteria=[
            {
                "criterion": c.criterion,
                "band": c.band,
                "explanation": c.explanation,
                "evidence_quotes": c.evidence_quotes,
                "descriptor_reference": c.descriptor_reference,
            }
            for c in outcome.criteria
        ],
        pipeline_version=outcome.pipeline_version,
        prompt_version=outcome.prompt_version,
        model_used=outcome.model_used,
    )
    db.add(result)
    db.flush()
    return result


def get_result_for_account(
    db: Session, *, submission_id: uuid.UUID, account_id: uuid.UUID
) -> tuple[EssaySubmission | None, AssessmentResult | None]:
    """Fetch a submission and its result, scoped to one account.

    Returns the submission separately so the caller can distinguish 403 (someone
    else's submission) from 404 (no such submission, or one that has no result
    because it was rejected/failed) — the contract defines both.
    """
    submission = db.get(EssaySubmission, submission_id)
    if submission is None:
        return None, None
    if submission.user_id != account_id:
        return submission, None
    return submission, submission.result
