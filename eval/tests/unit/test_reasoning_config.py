"""Reasoning-budget configuration (Constitution IV: methodology lives in YAML).

These pin behaviour that was learned the expensive way, on a live run: reasoning tokens
are output tokens, so on a reasoning model they compete with the JSON verdict for the
same `max_tokens` budget. The first real benchmark spent 1255 of 1536 tokens thinking,
got cut off mid-JSON, and failed every criterion.

The subtlety worth guarding is that OpenRouter has two switches that read like they do
the same thing and do not: `exclude` hides the trace while still generating and billing
it; only `enabled: false` frees the budget.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from src.pipeline.config import ModelConfig, ReasoningConfig, load_pipeline_config


class TestPayloadRendering:
    def test_default_is_off(self) -> None:
        """Silence must mean off — a caller that says nothing must not pay for tokens."""
        assert ReasoningConfig().to_payload() == {"enabled": False}

    def test_disabled_payload_does_not_merely_exclude(self) -> None:
        """`exclude` would still generate and bill the tokens; assert we do not use it
        as the off switch."""
        payload = ReasoningConfig(enabled=False).to_payload()
        assert payload["enabled"] is False
        assert "exclude" not in payload

    def test_effort_is_forwarded_when_enabled(self) -> None:
        payload = ReasoningConfig(enabled=True, effort="low").to_payload()
        assert payload == {"enabled": True, "exclude": False, "effort": "low"}

    def test_explicit_budget_is_forwarded_when_enabled(self) -> None:
        payload = ReasoningConfig(enabled=True, max_tokens=256, exclude=True).to_payload()
        assert payload == {"enabled": True, "exclude": True, "max_tokens": 256}


class TestMisconfigurationIsRejectedAtLoadTime:
    def test_effort_and_budget_together_are_rejected(self) -> None:
        with pytest.raises(ValidationError, match="mutually exclusive"):
            ReasoningConfig(enabled=True, effort="low", max_tokens=256)

    def test_settings_that_would_silently_do_nothing_are_rejected(self) -> None:
        """An effort level under `enabled: false` is almost certainly a mistake the
        author expects to take effect. Fail loudly rather than ignore it."""
        with pytest.raises(ValidationError, match="no effect"):
            ReasoningConfig(enabled=False, effort="high")

    def test_reasoning_budget_may_not_consume_the_whole_output_budget(self) -> None:
        """This is the original bug expressed as a rule: a reasoning budget that leaves
        no room for the answer guarantees truncation."""
        with pytest.raises(ValidationError, match="must be below"):
            ModelConfig(
                id="x/y",
                temperature=0.3,
                max_tokens=1024,
                reasoning=ReasoningConfig(enabled=True, max_tokens=1024),
            )


class TestShippedConfig:
    def test_v1_disables_reasoning_and_leaves_headroom(self) -> None:
        """Guards the shipped pipeline against a regression that would only show up as
        a 503 in production."""
        model = load_pipeline_config("pipelines/v1.yaml").model
        assert model.reasoning.to_payload() == {"enabled": False}
        # Measured: a criterion verdict costs ~580 completion tokens with reasoning off.
        assert model.max_tokens >= 2048
