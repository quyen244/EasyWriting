"""The scoring orchestrator (T028, T035).

Four criterion-evaluator LLM calls per assessment, issued CONCURRENTLY via
`asyncio.gather` (research.md decision 9). The prompts are independent — no criterion's
evaluation depends on another's output — so concurrency cuts wall-clock latency toward
SC-001's 60-second budget at identical LLM spend: the same 4 calls either way.

Everything numeric happens in code around the model (preprocess, aggregate, verify),
never inside it. That is what keeps the overall band reproducible and auditable.

Failure policy, which the API layer depends on:
  * One criterion failing does NOT abort the run — the others still produce their
    bands, and the outcome is marked `partial`.
  * But a partial outcome is NOT a shippable result. FR-012 and Constitution I forbid
    presenting a band without its explanation, and the OpenAPI contract requires
    exactly 4 criteria. So `run_assessment` raises `ScoringFailedError` on a partial
    run, which the endpoint maps to 503 SCORING_FAILED. The degraded detail is kept on
    the exception for logging, not discarded.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field

from src.llm.base import LLMClient
from src.llm.prompts.builders import build_criterion_messages
from src.llm.prompts.loader import PromptSet, get_prompt_set
from src.pipeline.aggregate import aggregate_overall, clamp, length_penalty, snap_band
from src.pipeline.config import PipelineConfig
from src.pipeline.errors import ScoringFailedError
from src.pipeline.preprocess import extract_features
from src.pipeline.verify import drop_unverified_quotes
from src.schemas.assessment import (
    CRITERIA_BY_TASK,
    TASK_CRITERIA,
    CriterionEvaluation,
    TextFeatures,
)
from src.utils.logging import get_logger

logger = get_logger("pipeline")


@dataclass
class CriterionOutcome:
    criterion: str
    band: float | None
    explanation: str = ""
    descriptor_reference: str | None = None
    evidence_quotes: list[str] = field(default_factory=list)
    raw_band: float | None = None
    applied_length_penalty: float = 0.0
    confidence: float = 0.0
    quotes_returned: int = 0
    quotes_dropped: int = 0
    band_was_coerced: bool = False
    degraded: bool = False
    error: str | None = None


@dataclass
class PipelineOutcome:
    overall_band: float
    raw_overall: float
    partial: bool
    criteria: list[CriterionOutcome]
    features: TextFeatures
    pipeline_version: str
    # Names the backend/prompts/<version>/ directory used, which covers both the
    # message templates and the rubrics — they version together by construction.
    prompt_version: str
    model_used: str
    latency_s: float
    prompt_tokens: int = 0
    completion_tokens: int = 0

    @property
    def quotes_returned(self) -> int:
        return sum(c.quotes_returned for c in self.criteria)

    @property
    def quotes_verified(self) -> int:
        return sum(len(c.evidence_quotes) for c in self.criteria)

    @property
    def quote_fidelity(self) -> float:
        return self.quotes_verified / self.quotes_returned if self.quotes_returned else 1.0


async def _evaluate_criterion(
    client: LLMClient,
    *,
    criterion: str,
    task_type: str,
    essay_text: str,
    prompt_text: str | None,
    features: TextFeatures,
    penalty: float,
    config: PipelineConfig,
    prompt_set: PromptSet,
) -> tuple[CriterionOutcome, int, int]:
    """Score one criterion. Returns (outcome, prompt_tokens, completion_tokens)."""
    node = f"criterion:{criterion}"
    messages = build_criterion_messages(
        task_type=task_type,
        criterion=criterion,
        essay_text=essay_text,
        features=features,
        prompt_text=prompt_text,
        prompt_set=prompt_set,
    )

    response = await client.chat(
        messages,
        CriterionEvaluation,
        node=node,
        max_tokens=config.model.max_tokens,
    )

    if not response.ok or response.parsed is None:
        logger.warning('"event":"criterion_failed","criterion":"%s"', criterion)
        return (
            CriterionOutcome(
                criterion=criterion, band=None, degraded=True, error=response.error
            ),
            response.prompt_tokens,
            response.completion_tokens,
        )

    parsed: CriterionEvaluation = response.parsed  # type: ignore[assignment]
    raw_band, coerced = snap_band(parsed.band)

    # Under-length is absorbed by the task criterion only, never spread across all four.
    applied = penalty if criterion in TASK_CRITERIA else 0.0
    final_band = round(clamp(raw_band - applied), 1) if applied else raw_band

    returned_quotes = [e.quote for e in parsed.evidence]
    verified_quotes, dropped = drop_unverified_quotes(returned_quotes, essay_text)
    if dropped:
        logger.warning(
            '"event":"quotes_dropped","criterion":"%s","dropped":%d',
            criterion,
            dropped,
        )

    return (
        CriterionOutcome(
            criterion=criterion,
            band=final_band,
            explanation=parsed.justification,
            descriptor_reference=parsed.descriptor_reference,
            evidence_quotes=verified_quotes,
            raw_band=raw_band,
            applied_length_penalty=applied,
            confidence=clamp(parsed.confidence, 0.0, 1.0),
            quotes_returned=len(returned_quotes),
            quotes_dropped=dropped,
            band_was_coerced=coerced,
        ),
        response.prompt_tokens,
        response.completion_tokens,
    )


async def run_assessment(
    client: LLMClient,
    *,
    task_type: str,
    essay_text: str,
    config: PipelineConfig,
    prompt_text: str | None = None,
    features: TextFeatures | None = None,
) -> PipelineOutcome:
    """Score one essay end to end. Raises ScoringFailedError if no complete result."""
    started = time.perf_counter()
    features = features or extract_features(essay_text, task_type)

    # Resolved once per assessment, not once per criterion: all four calls must use the
    # same prompt set, and a mid-run version change would make the result untraceable.
    prompt_set = get_prompt_set(config.prompts.version)

    lp = config.scoring.length_penalty
    penalty = length_penalty(
        features.length_deficit_ratio,
        moderate_deficit_ratio=lp.moderate_deficit_ratio,
        moderate_penalty=lp.moderate_penalty,
        severe_deficit_ratio=lp.severe_deficit_ratio,
        severe_penalty=lp.severe_penalty,
    )

    criteria = CRITERIA_BY_TASK[task_type]

    # The 4 calls that constitute this feature's entire LLM budget (Constitution V).
    results = await asyncio.gather(
        *(
            _evaluate_criterion(
                client,
                criterion=criterion,
                task_type=task_type,
                essay_text=essay_text,
                prompt_text=prompt_text,
                features=features,
                penalty=penalty,
                config=config,
                prompt_set=prompt_set,
            )
            for criterion in criteria
        )
    )

    outcomes = [outcome for outcome, _, _ in results]
    prompt_tokens = sum(p for _, p, _ in results)
    completion_tokens = sum(c for _, _, c in results)

    overall, raw, partial = aggregate_overall([o.band for o in outcomes])

    outcome = PipelineOutcome(
        overall_band=overall,
        raw_overall=raw,
        partial=partial,
        criteria=outcomes,
        features=features,
        pipeline_version=config.version,
        prompt_version=prompt_set.version,
        model_used=config.model.id,
        latency_s=round(time.perf_counter() - started, 3),
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )

    if partial:
        # Default (learner-facing) message is used deliberately; the per-criterion
        # upstream errors go to `failures` for the operator log only.
        raise ScoringFailedError(
            failures=[f"{o.criterion}: {o.error}" for o in outcomes if o.degraded]
        )

    logger.info(
        '"event":"assessment_scored","overall_band":%s,"latency_s":%s,'
        '"quote_fidelity":%s,"model":"%s"',
        overall,
        outcome.latency_s,
        round(outcome.quote_fidelity, 3),
        config.model.id,
    )
    return outcome
