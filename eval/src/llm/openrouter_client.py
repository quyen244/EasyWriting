"""OpenRouter adapter — the sole live LLM provider for this feature (T012).

Implements `LLMClient` against OpenRouter's OpenAI-compatible chat-completions API.
Adapted from the IE AI Evaluator's synchronous client, converted to `httpx.AsyncClient`
so the four criterion evaluators can run under `asyncio.gather` (research.md decision 9).

Keeps the source project's retry-repair loop: when the model returns JSON that fails
schema validation, the raw reply plus a repair instruction are appended to the
conversation and it is asked again. That recovers most malformed-JSON cases without a
human in the loop, which matters because a failed criterion degrades the whole result.

research.md decision 2 explicitly drops the Ollama adapter: OpenRouter is the sanctioned
path per Constitution V, and `FakeLLMClient` already covers offline/deterministic tests.
"""

from __future__ import annotations

import json
import time
from typing import Any

import httpx
from pydantic import BaseModel, ValidationError

from src.llm.base import LLMResponse
from src.utils.config import Settings, get_settings

REPAIR_TEMPLATE = (
    "Your previous response could not be validated.\n"
    "Error: {error}\n\n"
    "Return ONLY a JSON object that satisfies the schema. Do not add commentary, "
    "markdown fences, or extra fields."
)

TRUNCATION_TEMPLATE = (
    "Your previous response was cut off before the JSON was complete because it "
    "exceeded the output limit.\n\n"
    "Produce the same JSON structure but SHORTER: return at most half as many items "
    "in every list, and keep each text field under 200 characters. Completeness of "
    "the JSON matters more than completeness of the analysis."
)


class OpenRouterClientError(RuntimeError):
    pass


class OpenRouterClient:
    """LLMClient adapter for OpenRouter (and any OpenAI-compatible endpoint)."""

    def __init__(
        self,
        settings: Settings | None = None,
        *,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        reasoning: dict[str, Any] | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        # Model/params come from the active pipelines/*.yaml (Constitution IV), falling
        # back to Settings. Never hardcoded (Constitution V).
        self.model_name = model or self.settings.openrouter_model
        self.temperature = (
            temperature if temperature is not None else self.settings.openrouter_temperature
        )
        self.max_tokens = max_tokens or self.settings.llm_max_tokens
        # Reasoning tokens are output tokens: they are billed as output and they eat the
        # max_tokens budget. Callers that pass nothing get reasoning off, because a
        # truncated JSON verdict is a failed assessment, not a degraded one.
        self.reasoning = reasoning if reasoning is not None else {"enabled": False}

        self._api_key = self.settings.openrouter_api_key
        self._base_url = self.settings.openrouter_base_url.rstrip("/")
        self._timeout = self.settings.llm_timeout_s
        self._max_retries = self.settings.llm_max_retries

        # A missing key is deliberately NOT raised here. This class is built by a
        # FastAPI dependency, and FastAPI resolves every dependency before the handler
        # runs — so raising in __init__ turned a submission that should have been
        # rejected for word count (400) into an unhandled 500, because the client was
        # constructed before the validation gate ever executed.
        #
        # Instead `chat` reports the misconfiguration as a failed call, which the
        # pipeline turns into 503 SCORING_FAILED: the honest status for "this service
        # is not correctly configured", and one the contract already documents.

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://rexsantech.com",
            "X-Title": "WriteWise",
        }

    def _build_payload(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel] | None,
        max_tokens: int | None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": max_tokens or self.max_tokens,
        }
        if self.settings.llm_seed is not None:
            payload["seed"] = self.settings.llm_seed
        if self.reasoning:
            payload["reasoning"] = self.reasoning

        if response_model is not None:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": response_model.__name__,
                    "strict": True,
                    "schema": response_model.model_json_schema(),
                },
            }
        return payload

    async def _raw_chat(
        self,
        client: httpx.AsyncClient,
        messages: list[dict[str, str]],
        response_model: type[BaseModel] | None,
        max_tokens: int | None,
    ) -> dict[str, Any]:
        response = await client.post(
            f"{self._base_url}/chat/completions",
            headers=self._headers(),
            json=self._build_payload(messages, response_model, max_tokens),
        )
        response.raise_for_status()
        return response.json()

    @staticmethod
    def _extract(raw: dict[str, Any]) -> tuple[str, int, int, str | None]:
        choice = (raw.get("choices") or [{}])[0]
        content = (choice.get("message") or {}).get("content") or ""
        finish = choice.get("finish_reason")
        usage = raw.get("usage") or {}
        return (
            content,
            usage.get("prompt_tokens", 0),
            usage.get("completion_tokens", 0),
            finish,
        )

    @staticmethod
    def _strip_fences(content: str) -> str:
        """Some models wrap JSON in ```json ... ``` despite response_format."""
        clean = content.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            if len(lines) > 2:
                clean = "\n".join(lines[1:-1])
        return clean

    async def chat(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel] | None = None,
        *,
        node: str = "unknown",
        max_tokens: int | None = None,
    ) -> LLMResponse:
        convo = list(messages)
        started = time.perf_counter()
        last_error: str | None = None
        content = ""
        prompt_tokens = completion_tokens = 0

        if not self._api_key:
            # Operator-facing detail; the learner sees only the generic 503 body.
            return LLMResponse(
                node=node,
                model=self.model_name,
                ok=False,
                error=(
                    "OPENROUTER_API_KEY is not set — scoring cannot run. "
                    "Set it in backend/.env (local) or the deployment environment."
                ),
                latency_s=time.perf_counter() - started,
            )

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            for attempt in range(1, self._max_retries + 2):
                try:
                    raw = await self._raw_chat(client, convo, response_model, max_tokens)
                except httpx.HTTPStatusError as exc:
                    # Transport/quota failures are terminal for this node — retrying the
                    # same request against the same upstream would just burn budget.
                    return LLMResponse(
                        node=node,
                        model=self.model_name,
                        ok=False,
                        error=f"HTTP {exc.response.status_code}: {exc.response.text[:300]}",
                        attempts=attempt,
                        latency_s=time.perf_counter() - started,
                    )
                except Exception as exc:
                    return LLMResponse(
                        node=node,
                        model=self.model_name,
                        ok=False,
                        error=f"{type(exc).__name__}: {exc}",
                        attempts=attempt,
                        latency_s=time.perf_counter() - started,
                    )

                content, p_tok, c_tok, finish = self._extract(raw)
                prompt_tokens += p_tok
                completion_tokens += c_tok
                truncated = finish == "length"

                if response_model is None:
                    return LLMResponse(
                        node=node,
                        model=self.model_name,
                        ok=True,
                        content=content,
                        attempts=attempt,
                        latency_s=time.perf_counter() - started,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                    )

                try:
                    parsed = response_model.model_validate_json(self._strip_fences(content))
                except (ValidationError, json.JSONDecodeError) as exc:
                    last_error = (
                        "output truncated at token limit: " if truncated else ""
                    ) + str(exc)[:600]
                    convo = convo + [
                        {"role": "assistant", "content": content},
                        {
                            "role": "user",
                            "content": TRUNCATION_TEMPLATE
                            if truncated
                            else REPAIR_TEMPLATE.format(error=last_error),
                        },
                    ]
                    continue

                return LLMResponse(
                    node=node,
                    model=self.model_name,
                    ok=True,
                    content=content,
                    parsed=parsed,
                    attempts=attempt,
                    latency_s=time.perf_counter() - started,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                )

        return LLMResponse(
            node=node,
            model=self.model_name,
            ok=False,
            content=content,
            error=last_error,
            attempts=self._max_retries + 1,
            latency_s=time.perf_counter() - started,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )
