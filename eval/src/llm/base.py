"""Provider-agnostic LLM interface (T011, research.md decision 2).

The pipeline talks only to this Protocol, never to a concrete provider. Constitution
Principle V requires the model to be a config value behind a model-agnostic interface,
so swapping OpenRouter for another provider means adding an adapter here, not editing
any scoring logic.

Adapted from the IE AI Evaluator's `src/llm/base.py`, with one deliberate change:
`chat` is **async**. research.md decision 9 calls for the four criterion evaluators to
run concurrently via `asyncio.gather` to stay inside SC-001's 60-second budget, and a
sync Protocol would make that impossible without a thread pool.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable

from pydantic import BaseModel


@dataclass
class LLMResponse:
    """One completed call to a provider.

    `ok=False` is a normal, expected outcome, not an exception: a single criterion
    failing must degrade that criterion only, never abort the whole assessment
    (see pipeline.py). Callers branch on `ok`, they do not catch.
    """

    node: str
    model: str
    ok: bool
    content: str = ""
    parsed: BaseModel | None = None
    error: str | None = None
    attempts: int = 1
    latency_s: float = 0.0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    meta: dict = field(default_factory=dict)


@runtime_checkable
class LLMClient(Protocol):
    model_name: str

    async def chat(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel] | None = None,
        *,
        node: str = "unknown",
        max_tokens: int | None = None,
    ) -> LLMResponse: ...
