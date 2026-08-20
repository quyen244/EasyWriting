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

import yaml
from pydantic import BaseModel, Field

from src.utils.config import get_settings

# backend/ — this file is backend/src/pipeline/config.py
BACKEND_ROOT = Path(__file__).resolve().parents[2]


class ModelConfig(BaseModel):
    id: str
    temperature: float = Field(ge=0.0, le=2.0)
    max_tokens: int = Field(gt=0)
    seed: int | None = None
    timeout_s: int = Field(gt=0, default=180)
    max_retries: int = Field(ge=0, default=2)


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
