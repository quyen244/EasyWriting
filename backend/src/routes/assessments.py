"""Assessment endpoints (T032, T033, T034, T035, T041).

POST /api/v1/assessments        — submit an essay for scoring
GET  /api/v1/assessments/{id}   — view a previously produced result

Both are gated behind `get_current_account`, the same dependency 003 built (FR-008,
Constitution VII: auth is owned and enforced by the backend).

The write path persists an `EssaySubmission` row on EVERY outcome — scored, rejected,
and failed alike. FR-009 promises a learner never loses their text to a failure, and
recording it before the fallible part runs is the only way to mean that server-side.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from src.auth.deps import get_current_account
from src.database import repository
from src.database.connections import get_db
from src.llm.base import LLMClient
from src.llm.openrouter_client import OpenRouterClient
from src.models import Account, RejectionReason, SubmissionStatus
from src.pipeline.config import PipelineConfig, get_pipeline_config
from src.pipeline.errors import (
    AssessmentNotFoundError,
    BelowMinWordsError,
    ScoringFailedError,
    SubmissionForbiddenError,
    UnscoreableError,
)
from src.pipeline.pipeline import run_assessment
from src.pipeline.preprocess import extract_features, find_unscoreable_reason
from src.schemas.assessment import (
    AssessmentRequest,
    AssessmentResultResponse,
    CriterionScore,
)
from src.utils.logging import get_logger

router = APIRouter(prefix="/api/v1/assessments", tags=["assessments"])
logger = get_logger("assessments")


def get_llm_client(
    config: PipelineConfig = Depends(get_pipeline_config),
) -> LLMClient:
    """Live LLM client built from the active pipeline config.

    Overridden in tests via `app.dependency_overrides` to inject `FakeLLMClient`, which
    is what keeps the whole suite offline and free (Constitution III + V).
    """
    return OpenRouterClient(
        model=config.model.id,
        temperature=config.model.temperature,
        max_tokens=config.model.max_tokens,
        reasoning=config.model.reasoning.to_payload(),
    )


@router.post(
    "",
    response_model=AssessmentResultResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_assessment(
    payload: AssessmentRequest,
    request: Request,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
    client: LLMClient = Depends(get_llm_client),
    config: PipelineConfig = Depends(get_pipeline_config),
) -> AssessmentResultResponse:
    features = extract_features(payload.essay_text, payload.task_type)

    # --- FR-007 then FR-006, both BEFORE any LLM spend (Constitution V) -------
    unscoreable_reason = find_unscoreable_reason(payload.essay_text, features)
    if unscoreable_reason is not None:
        repository.create_submission(
            db,
            account_id=account.id,
            task_type=payload.task_type,
            essay_text=payload.essay_text,
            prompt_text=payload.prompt_text,
            word_count=features.word_count,
            status=SubmissionStatus.REJECTED,
            rejection_reason=RejectionReason.UNSCOREABLE,
        )
        db.commit()
        # Essay text is never logged (Constitution VII / T048) — only its shape.
        logger.info(
            '"event":"submission_rejected","reason":"UNSCOREABLE","word_count":%d',
            features.word_count,
        )
        raise UnscoreableError(unscoreable_reason)

    if not features.meets_min_words:
        repository.create_submission(
            db,
            account_id=account.id,
            task_type=payload.task_type,
            essay_text=payload.essay_text,
            prompt_text=payload.prompt_text,
            word_count=features.word_count,
            status=SubmissionStatus.REJECTED,
            rejection_reason=RejectionReason.BELOW_MIN_WORDS,
        )
        db.commit()
        logger.info(
            '"event":"submission_rejected","reason":"BELOW_MIN_WORDS","word_count":%d',
            features.word_count,
        )
        raise BelowMinWordsError(features.min_words_required, features.word_count)

    # --- Scoring -------------------------------------------------------------
    try:
        outcome = await run_assessment(
            client,
            task_type=payload.task_type,
            essay_text=payload.essay_text,
            prompt_text=payload.prompt_text,
            config=config,
            features=features,
        )
    except ScoringFailedError as exc:
        repository.create_submission(
            db,
            account_id=account.id,
            task_type=payload.task_type,
            essay_text=payload.essay_text,
            prompt_text=payload.prompt_text,
            word_count=features.word_count,
            status=SubmissionStatus.FAILED,
            failure_detail="; ".join(exc.failures) or str(exc),
        )
        db.commit()
        logger.error(
            '"event":"scoring_failed","failures":"%s"', "; ".join(exc.failures)[:500]
        )
        raise

    submission = repository.create_submission(
        db,
        account_id=account.id,
        task_type=payload.task_type,
        essay_text=payload.essay_text,
        prompt_text=payload.prompt_text,
        word_count=features.word_count,
        status=SubmissionStatus.SCORED,
    )
    result = repository.create_result(db, submission=submission, outcome=outcome)
    db.commit()
    db.refresh(result)

    logger.info(
        '"event":"assessment_created","submission_id":"%s","overall_band":%s,'
        '"latency_s":%s',
        submission.id,
        outcome.overall_band,
        outcome.latency_s,
    )

    return AssessmentResultResponse(
        submission_id=submission.id,
        overall_band=float(result.overall_band),
        criteria=[CriterionScore.model_validate(c) for c in result.criteria],
        created_at=result.created_at,
    )


@router.get("/{submission_id}", response_model=AssessmentResultResponse)
def get_assessment(
    submission_id: uuid.UUID,
    response: Response,
    db: Session = Depends(get_db),
    account: Account = Depends(get_current_account),
) -> AssessmentResultResponse:
    submission, result = repository.get_result_for_account(
        db, submission_id=submission_id, account_id=account.id
    )

    if submission is not None and submission.user_id != account.id:
        raise SubmissionForbiddenError()
    if result is None:
        raise AssessmentNotFoundError()

    return AssessmentResultResponse(
        submission_id=submission.id,
        overall_band=float(result.overall_band),
        criteria=[CriterionScore.model_validate(c) for c in result.criteria],
        created_at=result.created_at,
    )
