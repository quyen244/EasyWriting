"""Deterministic offline LLM test double (T013).

Constitution Principle III (Test-First, NON-NEGOTIABLE) requires red-green cycles, and
Principle V forbids burning API budget on tests. This client satisfies both: it returns
schema-valid payloads instantly with no network, so the whole pipeline — orchestration,
concurrency, verification, degradation, persistence — is testable offline and in CI.

It implements the `LLMClient` Protocol structurally, so `isinstance(client, LLMClient)`
passes and the pipeline cannot tell it apart from the real adapter.
"""

from __future__ import annotations

import asyncio

from pydantic import BaseModel

from src.llm.base import LLMResponse
from src.schemas.assessment import CriterionEvaluation


class FakeLLMClient:
    """Returns a fixed band and quote for every criterion.

    Args:
        band: the band every criterion evaluator returns.
        quote: the evidence quote returned. Pass a string that really appears in the
            test essay to exercise the verified path, or one that does not to exercise
            the fabrication-detection path.
        fail_nodes: node names (e.g. "criterion:LEXICAL_RESOURCE") forced to fail,
            for testing graceful degradation.
        bands_by_criterion: per-criterion band overrides, for testing aggregation.
        delay_s: artificial latency, used to prove calls really run concurrently.
    """

    model_name = "fake-model"

    def __init__(
        self,
        band: float = 6.0,
        *,
        quote: str = "social media",
        fail_nodes: set[str] | None = None,
        bands_by_criterion: dict[str, float] | None = None,
        delay_s: float = 0.0,
    ) -> None:
        self.band = band
        self.quote = quote
        self.fail_nodes = fail_nodes or set()
        self.bands_by_criterion = bands_by_criterion or {}
        self.delay_s = delay_s
        self.calls: list[str] = []

    async def chat(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel] | None = None,
        *,
        node: str = "unknown",
        max_tokens: int | None = None,
    ) -> LLMResponse:
        self.calls.append(node)

        if self.delay_s:
            await asyncio.sleep(self.delay_s)

        if node in self.fail_nodes:
            return LLMResponse(
                node=node,
                model=self.model_name,
                ok=False,
                error="forced failure",
                attempts=3,
            )

        if response_model is not CriterionEvaluation:
            return LLMResponse(node=node, model=self.model_name, ok=True, content="ok")

        criterion = node.split(":", 1)[-1]
        band = self.bands_by_criterion.get(criterion, self.band)
        payload = CriterionEvaluation(
            justification=(
                f"The essay matches the band {band} descriptor for {criterion} "
                "rather than the band above or below."
            ),
            descriptor_reference=f"{criterion} band {band}",
            band=band,
            confidence=0.8,
            evidence=[{"quote": self.quote, "comment": "Illustrates the band."}],
        )
        return LLMResponse(
            node=node,
            model=self.model_name,
            ok=True,
            content=payload.model_dump_json(),
            parsed=payload,
            prompt_tokens=100,
            completion_tokens=50,
            latency_s=0.01,
        )
