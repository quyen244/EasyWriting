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
        quotes_by_criterion: per-criterion evidence quotes, so a test can assert that
            a specific passage surfaces under a specific criterion (User Story 2).
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
        quotes_by_criterion: dict[str, list[str]] | None = None,
        echo_real_quote: bool = False,
        delay_s: float = 0.0,
    ) -> None:
        self.band = band
        self.quote = quote
        self.echo_real_quote = echo_real_quote
        self.fail_nodes = fail_nodes or set()
        self.bands_by_criterion = bands_by_criterion or {}
        self.quotes_by_criterion = quotes_by_criterion or {}
        self.delay_s = delay_s
        self.calls: list[str] = []
        # Records the rendered prompt per criterion so tests can assert the right
        # rubric and essay actually reached the model.
        self.messages_by_node: dict[str, list[dict[str, str]]] = {}

    @staticmethod
    def _extract_real_quote(messages: list[dict[str, str]]) -> str:
        """Pull a genuine span out of the essay embedded in the prompt.

        Lets a fake run produce quotes that actually verify, so a harness smoke test
        reports meaningful quote-fidelity instead of a uniform zero. Mirrors what a
        well-behaved model does: copy from between the ESSAY markers.
        """
        user = messages[-1]["content"]
        if "<<<ESSAY" not in user:
            return "the essay"
        body = user.split("<<<ESSAY", 1)[1].split("\nESSAY", 1)[0].strip()
        words = body.split()
        return " ".join(words[:8]) if len(words) >= 8 else body[:60]

    async def chat(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel] | None = None,
        *,
        node: str = "unknown",
        max_tokens: int | None = None,
    ) -> LLMResponse:
        self.calls.append(node)
        self.messages_by_node[node] = messages

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
        quotes = self.quotes_by_criterion.get(
            criterion,
            [self._extract_real_quote(messages) if self.echo_real_quote else self.quote],
        )
        payload = CriterionEvaluation(
            justification=(
                f"The essay matches the band {band} descriptor for {criterion} "
                "rather than the band above or below."
            ),
            descriptor_reference=f"{criterion} band {band}",
            band=band,
            confidence=0.8,
            evidence=[{"quote": q, "comment": "Illustrates the band."} for q in quotes],
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
