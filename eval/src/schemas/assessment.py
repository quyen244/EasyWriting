"""Assessment data contracts (T026).

Three groups live here, and the distinction matters:

  * **API-facing** (`AssessmentRequest`, `AssessmentResultResponse`, `CriterionScore`,
    the error bodies) — these must match contracts/assessments-openapi.yaml exactly.
  * **LLM-facing** (`CriterionEvaluation`, `Evidence`) — these cross the model boundary
    as a JSON schema. Field ORDER is deliberate: constrained decoding emits properties
    sequentially, so `justification` sitting before `band` forces the model to reason
    before it commits to a number. Reordering them silently degrades scoring quality.
  * **Internal** (`TextFeatures`) — computed in code, never by the model.

Criterion names are the OpenAPI enum values throughout (`TASK_RESPONSE`, not `TR`).
The reference project used short codes internally and would have needed a translation
layer at the API boundary; one vocabulary end-to-end is simpler (Constitution VI).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TaskType = Literal["TASK_1", "TASK_2"]

CriterionCode = Literal[
    "TASK_ACHIEVEMENT",
    "TASK_RESPONSE",
    "COHERENCE_COHESION",
    "LEXICAL_RESOURCE",
    "GRAMMATICAL_RANGE_ACCURACY",
]

# FR-005: Task 1 is scored on Task Achievement, Task 2 on Task Response; the other
# three criteria are shared. Exactly four per assessment (Constitution V: 4 LLM calls).
CRITERIA_BY_TASK: dict[str, tuple[str, ...]] = {
    "TASK_1": (
        "TASK_ACHIEVEMENT",
        "COHERENCE_COHESION",
        "LEXICAL_RESOURCE",
        "GRAMMATICAL_RANGE_ACCURACY",
    ),
    "TASK_2": (
        "TASK_RESPONSE",
        "COHERENCE_COHESION",
        "LEXICAL_RESOURCE",
        "GRAMMATICAL_RANGE_ACCURACY",
    ),
}

CRITERION_NAMES: dict[str, str] = {
    "TASK_ACHIEVEMENT": "Task Achievement",
    "TASK_RESPONSE": "Task Response",
    "COHERENCE_COHESION": "Coherence and Cohesion",
    "LEXICAL_RESOURCE": "Lexical Resource",
    "GRAMMATICAL_RANGE_ACCURACY": "Grammatical Range and Accuracy",
}

# The two task-level criteria absorb the under-length penalty; see pipeline/aggregate.py.
TASK_CRITERIA = frozenset({"TASK_ACHIEVEMENT", "TASK_RESPONSE"})


# --------------------------------------------------------------------------- #
# Internal — computed deterministically, never by the LLM
# --------------------------------------------------------------------------- #
class TextFeatures(BaseModel):
    word_count: int
    sentence_count: int
    paragraph_count: int
    avg_sentence_length: float
    unique_words: int
    type_token_ratio: float
    repeated_content_words: list[tuple[str, int]]
    cohesive_devices_found: list[str]
    min_words_required: int
    meets_min_words: bool
    length_deficit_ratio: float


# --------------------------------------------------------------------------- #
# LLM-FACING — field order is load-bearing, see module docstring
# --------------------------------------------------------------------------- #
class Evidence(BaseModel):
    quote: str = Field(description="Text copied verbatim from the student essay")
    comment: str = Field(description="Why this quote supports the assessment")


class CriterionEvaluation(BaseModel):
    justification: str = Field(
        description="3-5 sentences naming the band descriptor the essay matches and "
        "why it matches that one rather than the band above or below. "
        "Write this BEFORE deciding the band."
    )
    descriptor_reference: str = Field(
        description="The band-descriptor line this judgement is grounded in, "
        'e.g. "LEXICAL_RESOURCE band 6".'
    )
    band: float = Field(description="Band score from 1.0 to 9.0 in steps of 0.5")
    confidence: float = Field(description="How certain you are, 0.0 to 1.0")
    evidence: list[Evidence] = Field(description="2-4 verbatim quotes with commentary")


# --------------------------------------------------------------------------- #
# LLM-FACING — pipeline-v2.0, the single-call combined evaluation.
#
# `v1` asked one question per call (4 calls); `v2` asks all four at once. The four
# criteria are NAMED FIELDS on the response object, not an array with a `code` per
# item — this is a deliberate departure from the array shape sketched in
# specs/00-grading-feature/spec.md §11 during design. An array requires trusting the
# model to both report the right `code` per item AND return the four items in the
# right order (spec.md's original "reorder server-side" step exists only to cover
# for that). A named-field object needs neither: `strict: true` structured output
# makes every field required, so the four criteria the model must answer are fixed
# by the schema itself, in a fixed position, before generation even starts — there
# is no ordering or mislabelling failure mode left to guard against. Two schemas
# exist (Task 1 vs Task 2) because the first field's name IS the first criterion's
# code, and that code differs by task type (CRITERIA_BY_TASK).
# --------------------------------------------------------------------------- #
class Bilingual(BaseModel):
    en: str = Field(description="English text. Must not be empty.")
    vi: str = Field(
        description="Vietnamese text, IELTS terminology kept in English. Must not be empty."
    )


class CombinedCriterionBlock(BaseModel):
    """One criterion's full judgement inside a single-call response.

    Field order matches `CriterionEvaluation`'s reasoning-before-answering property
    (module docstring): `justification` before `band`, and both learner-facing fields
    (`comment`, `improvement`) come AFTER the band is already committed to, so they
    explain a decision already made rather than being drafted independently of it.
    """

    justification: str = Field(
        description="3-5 sentences naming the band descriptor THIS criterion matches "
        "and why, before deciding the band. Assess this criterion only — ignore "
        "problems that belong to a different criterion."
    )
    descriptor_reference: str = Field(
        description='The band-descriptor line this judgement is grounded in, '
        'e.g. "LEXICAL_RESOURCE band 6".'
    )
    band: float = Field(description="Band score from 1.0 to 9.0 in steps of 0.5")
    confidence: float = Field(description="How certain you are in THIS criterion, 0.0 to 1.0")
    comment: Bilingual = Field(
        description="2-3 sentences, learner-facing, explaining this band in both languages."
    )
    improvement: Bilingual = Field(
        description="One concrete, actionable next step for THIS criterion, in both "
        "languages, tied to something the essay actually did."
    )
    evidence: list[Evidence] = Field(description="2-4 verbatim quotes with commentary")


class CombinedEvaluationTask1(BaseModel):
    """The single-call response shape for TASK_1 — field order is CRITERIA_BY_TASK order."""

    task_achievement: CombinedCriterionBlock
    coherence_cohesion: CombinedCriterionBlock
    lexical_resource: CombinedCriterionBlock
    grammatical_range_accuracy: CombinedCriterionBlock


class CombinedEvaluationTask2(BaseModel):
    """The single-call response shape for TASK_2 — field order is CRITERIA_BY_TASK order."""

    task_response: CombinedCriterionBlock
    coherence_cohesion: CombinedCriterionBlock
    lexical_resource: CombinedCriterionBlock
    grammatical_range_accuracy: CombinedCriterionBlock


COMBINED_RESPONSE_MODEL_BY_TASK: dict[str, type[BaseModel]] = {
    "TASK_1": CombinedEvaluationTask1,
    "TASK_2": CombinedEvaluationTask2,
}


def combined_response_model_for(task_type: str) -> type[BaseModel]:
    return COMBINED_RESPONSE_MODEL_BY_TASK[task_type]


def combined_field_for(criterion: str) -> str:
    """CRITERIA_BY_TASK codes are already valid Python identifiers lowercased —
    'TASK_ACHIEVEMENT' -> 'task_achievement', matching the schema field name exactly."""
    return criterion.lower()


# --------------------------------------------------------------------------- #
# API-FACING — must match contracts/assessments-openapi.yaml
# --------------------------------------------------------------------------- #
class AssessmentRequest(BaseModel):
    task_type: TaskType
    prompt_text: str | None = None
    # Only non-emptiness is a schema concern. The word-count and scoreability rules are
    # business rules returning 400 BELOW_MIN_WORDS / UNSCOREABLE, so they live in the
    # domain layer -- enforcing them here would surface FastAPI's 422 shape instead,
    # which the contract does not define. (Same lesson as 003's WEAK_PASSWORD.)
    essay_text: str = Field(min_length=1)


class CriterionScore(BaseModel):
    criterion: CriterionCode
    band: float = Field(ge=1.0, le=9.0)
    explanation: str
    evidence_quotes: list[str] = Field(default_factory=list)
    # Beyond the OpenAPI required set, but mandated by data-model.md and Constitution I:
    # a score must be traceable to the specific descriptor it came from.
    descriptor_reference: str | None = None


class AssessmentResultResponse(BaseModel):
    submission_id: uuid.UUID
    overall_band: float = Field(ge=1.0, le=9.0)
    criteria: list[CriterionScore] = Field(min_length=4, max_length=4)
    created_at: datetime

    model_config = {"from_attributes": True}


RejectionCode = Literal["BELOW_MIN_WORDS", "UNSCOREABLE"]


class RejectionError(BaseModel):
    error: RejectionCode
    message: str
    minimum_words: int | None = None


class ScoringFailureError(BaseModel):
    error: Literal["SCORING_FAILED"]
    message: str
