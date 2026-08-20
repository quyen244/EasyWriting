"""Regression tests that exercise the REAL OpenRouter client, not the fake.

Every other assessment test overrides `get_llm_client` with `FakeLLMClient`, which is
correct for behaviour coverage but left a blind spot: the genuine client was never
constructed, so a crash in its constructor went unnoticed until the app ran in Docker.

That is exactly what happened. `OpenRouterClient.__init__` raised on a missing
OPENROUTER_API_KEY; because FastAPI resolves all dependencies BEFORE invoking the
handler, an essay that should have been rejected for word count (400) instead produced
an unhandled 500 — the validation gate never got to run.

These tests make no network calls: they run with an unset key, which is precisely the
misconfiguration being guarded against.
"""

from __future__ import annotations

import pytest

from src.llm.openrouter_client import OpenRouterClient
from src.utils.config import Settings
from tests.conftest import TASK_2_ESSAY

# Long enough to clear the 20-word "nothing to assess" floor (which would return
# UNSCOREABLE), but well under the 250-word Task 2 minimum — so this lands on
# BELOW_MIN_WORDS specifically, which is the gate under test.
SHORT_ESSAY = (
    "Education should be free for everyone because it increases social mobility. "
    "Students from poorer families gain access to opportunities they would otherwise "
    "never have, and the wider economy benefits from a better trained workforce. "
    "For these reasons governments should fund education fully."
)


@pytest.fixture
def keyless_settings() -> Settings:
    """Settings with no API key — a fresh deployment before secrets are wired up."""
    return Settings(openrouter_api_key="", database_url="postgresql+psycopg://x:y@z/db")


@pytest.fixture
def real_client(client, keyless_settings):
    """Install the genuine OpenRouterClient (keyless) as the route dependency."""
    from src.main import app
    from src.routes.assessments import get_llm_client

    app.dependency_overrides[get_llm_client] = lambda: OpenRouterClient(keyless_settings)
    yield client
    app.dependency_overrides.pop(get_llm_client, None)


class TestConstructionIsSafe:
    def test_client_constructs_without_an_api_key(self, keyless_settings) -> None:
        """Construction must never raise: it happens during dependency resolution, i.e.
        before any request validation, so a raise here breaks unrelated error paths."""
        client = OpenRouterClient(keyless_settings)
        assert client.model_name

    async def test_calling_without_a_key_fails_gracefully(self, keyless_settings) -> None:
        response = await OpenRouterClient(keyless_settings).chat(
            [{"role": "user", "content": "hi"}], node="criterion:LEXICAL_RESOURCE"
        )
        assert response.ok is False
        assert "OPENROUTER_API_KEY" in (response.error or "")


class TestMisconfigurationDoesNotBreakValidation:
    def test_word_count_rejection_still_returns_400_not_500(
        self, real_client, authed_client_factory
    ) -> None:
        """The original bug, pinned: a rejected submission must not depend on the LLM
        client being usable, because it never reaches the model."""
        _, token, _ = authed_client_factory("wiring.short@example.com")
        response = real_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": SHORT_ESSAY},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 400, response.text
        assert response.json()["error"] == "BELOW_MIN_WORDS"

    def test_unscoreable_rejection_still_returns_400_not_500(
        self, real_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("wiring.gibberish@example.com")
        response = real_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": "asdf " * 200},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 400, response.text
        assert response.json()["error"] == "UNSCOREABLE"

    def test_unauthenticated_request_still_returns_401_not_500(self, real_client) -> None:
        response = real_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
        )
        assert response.status_code == 401

    def test_a_valid_essay_reports_503_not_500(
        self, real_client, authed_client_factory
    ) -> None:
        """A missing key IS a real failure — but it is 'service unavailable', which the
        contract documents, not an unhandled crash."""
        _, token, _ = authed_client_factory("wiring.valid@example.com")
        response = real_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 503, response.text
        assert response.json()["error"] == "SCORING_FAILED"

    def test_the_503_does_not_leak_the_configuration_detail(
        self, real_client, authed_client_factory
    ) -> None:
        """Naming the missing environment variable to an end user is an information
        leak about the deployment, and useless to them besides."""
        _, token, _ = authed_client_factory("wiring.noleak@example.com")
        body = real_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
            headers={"Authorization": f"Bearer {token}"},
        ).json()

        assert "OPENROUTER_API_KEY" not in body["message"]
        assert ".env" not in body["message"]
