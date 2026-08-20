"""Loader for the versioned pipeline config (T014, Constitution Principle IV).

Principle IV requires the scoring configuration — prompt version, model id, params —
to live in a versioned YAML file rather than in code or environment variables, so that
a methodology change can be hypothesis-tested before/after against the golden dataset.
`backend/pipelines/*.yaml` is that file; this module parses and validates it.

Validation is strict on purpose: a typo in the config silently scoring every essay with
the wrong model would poison the benchmark comparison that Principle IV exists to make
trustworthy. Better to fail loudly at load time.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, Field, model_validator

from src.utils.config import get_settings

# backend/ — this file is backend/src/pipeline/config.py
BACKEND_ROOT = Path(__file__).resolve().parents[2]

EffortLevel = Literal["none", "minimal", "low", "medium", "high", "xhigh", "max"]


class ReasoningConfig(BaseModel):
    """OpenRouter's `reasoning` request block.

    This exists because reasoning tokens are *output* tokens: they are billed as such
    and they count against `max_tokens`. On a reasoning model that is not merely a cost
    question, it is a correctness one — measured on this pipeline, the criterion prompt
    burned 1255 of 1536 tokens thinking and was cut off mid-JSON, so every criterion
    failed schema validation and the whole assessment returned 503.

    Note the two "off" switches are NOT interchangeable:
      * `exclude: true`  — the model still reasons and is still billed; the trace is
                           merely withheld from the response. It does not free budget.
      * `enabled: false` — reasoning generation is genuinely off (measured: 0 tokens).

    Only the second one solves the truncation, which is why it is the default here.
    """

    enabled: bool = False
    effort: EffortLevel | None = None
    max_tokens: int | None = Field(default=None, gt=0)
    exclude: bool = False

    @model_validator(mode="after")
    def _reject_conflicting_budgets(self) -> ReasoningConfig:
        # OpenRouter accepts an effort level or an explicit budget, never both.
        if self.effort is not None and self.max_tokens is not None:
            raise ValueError(
                "reasoning.effort and reasoning.max_tokens are mutually exclusive — "
                "set an effort level or an explicit token budget, not both."
            )
        if not self.enabled and (self.effort or self.max_tokens):
            raise ValueError(
                "reasoning.effort/max_tokens have no effect while reasoning.enabled is "
                "false. Set enabled: true to use them, or remove them."
            )
        return self

    def to_payload(self) -> dict[str, Any]:
        """Render the request block OpenRouter expects."""
        if not self.enabled:
            return {"enabled": False}
        block: dict[str, Any] = {"enabled": True, "exclude": self.exclude}
        if self.effort is not None:
            block["effort"] = self.effort
        if self.max_tokens is not None:
            block["max_tokens"] = self.max_tokens
        return block


class ModelConfig(BaseModel):
    id: str
    temperature: float = Field(ge=0.0, le=2.0)
    max_tokens: int = Field(gt=0)
    seed: int | None = None
    timeout_s: int = Field(gt=0, default=180)
    max_retries: int = Field(ge=0, default=2)
    # Defaults to off: this pipeline wants a compact JSON verdict, and every reasoning
    # token spent is a token not available for that JSON.
    reasoning: ReasoningConfig = Field(default_factory=ReasoningConfig)

    @model_validator(mode="after")
    def _budget_must_leave_room_for_output(self) -> ModelConfig:
        """A reasoning budget at or above max_tokens guarantees a truncated answer."""
        budget = self.reasoning.max_tokens
        if budget is not None and budget >= self.max_tokens:
            raise ValueError(
                f"reasoning.max_tokens ({budget}) must be below model.max_tokens "
                f"({self.max_tokens}), otherwise no budget remains for the response."
            )
        return self


class LengthPenaltyConfig(BaseModel):
    moderate_deficit_ratio: float = Field(ge=0.0, le=1.0)
    moderate_penalty: float = Field(ge=0.0)
    severe_deficit_ratio: float = Field(ge=0.0, le=1.0)
    severe_penalty: float = Field(ge=0.0)


class ScoringConfig(BaseModel):
    length_penalty: LengthPenaltyConfig


class PromptsConfig(BaseModel):
    # Names a directory under backend/prompts/. That directory holds both the message
    # templates and the rubrics, so one version string covers the whole prompt surface.
    version: str


class PipelineConfig(BaseModel):
    version: str
    model: ModelConfig
    prompts: PromptsConfig
    scoring: ScoringConfig


class PipelineConfigError(RuntimeError):
    pass


def resolve_config_path(config_path: str | Path | None = None) -> Path:
    """Resolve a pipeline config path relative to backend/ unless already absolute."""
    raw = Path(config_path or get_settings().pipeline_config)
    return raw if raw.is_absolute() else BACKEND_ROOT / raw


def load_pipeline_config(config_path: str | Path | None = None) -> PipelineConfig:
    path = resolve_config_path(config_path)
    if not path.is_file():
        raise PipelineConfigError(
            f"Pipeline config not found at {path}. Constitution Principle IV requires "
            "scoring methodology to be captured in a versioned YAML file."
        )

    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        raise PipelineConfigError(f"{path} is not valid YAML: {exc}") from exc

    if not isinstance(raw, dict):
        raise PipelineConfigError(f"{path} must contain a YAML mapping at the top level.")

    try:
        return PipelineConfig.model_validate(raw)
    except Exception as exc:
        raise PipelineConfigError(f"{path} failed validation: {exc}") from exc


@lru_cache
def get_pipeline_config(config_path: str | None = None) -> PipelineConfig:
    """Cached accessor for the active config — the common request path."""
    return load_pipeline_config(config_path)
