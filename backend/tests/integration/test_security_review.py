"""Security review as executable tests (T048, Constitution Principle VII).

A checklist someone ticked once rots. These assert the three properties the review
actually cares about, so a regression fails CI instead of being discovered in a log
dump months later:

  1. Both assessment endpoints reject unauthenticated callers (FR-008).
  2. Learner essay text never reaches the logs (Principle VII: essay data is used only
     to produce the requested evaluation).
  3. Nothing sensitive leaks into API responses.
"""

from __future__ import annotations

import logging
import uuid

import pytest

from tests.conftest import TASK_2_ESSAY
from tests.fakes.fake_llm_client import FakeLLMClient

# A distinctive phrase planted in the essay. If this string appears anywhere in the
# captured logs, essay content is being written to disk somewhere it should not be.
CANARY = "zqxjkv-canary-phrase-unique-to-this-test"


def _essay_with_canary() -> str:
    return TASK_2_ESSAY.replace(
        "In recent decades,", f"In recent decades {CANARY},", 1
    )


class TestAuthenticationIsRequired:
    """FR-008 / Principle VII: auth is owned and enforced by the backend."""

    def test_post_rejects_anonymous_callers(self, scoring_client) -> None:
        response = scoring_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
        )
        assert response.status_code == 401

    def test_get_rejects_anonymous_callers(self, scoring_client) -> None:
        response = scoring_client.get(f"/api/v1/assessments/{uuid.uuid4()}")
        assert response.status_code == 401

    @pytest.mark.parametrize(
        "header",
        [
            {"Authorization": "Bearer "},
            {"Authorization": "Bearer not.a.jwt"},
            {"Authorization": "Basic dXNlcjpwYXNz"},
            {"Authorization": "eyJhbGciOiJIUzI1NiJ9.e30.invalid"},
        ],
    )
    def test_malformed_credentials_are_rejected(self, scoring_client, header) -> None:
        response = scoring_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
            headers=header,
        )
        assert response.status_code == 401

    def test_a_token_signed_with_the_wrong_key_is_rejected(self, scoring_client) -> None:
        """Guards against accepting a token this server did not issue."""
        import jwt

        forged = jwt.encode(
            {"sub": str(uuid.uuid4()), "iat": 0, "exp": 9999999999},
            "not-the-real-signing-key",
            algorithm="HS256",
        )
        response = scoring_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
            headers={"Authorization": f"Bearer {forged}"},
        )
        assert response.status_code == 401


class TestEssayTextIsNeverLogged:
    """Principle VII: learner essay data is used only to produce the evaluation."""

    def test_successful_scoring_does_not_log_the_essay(
        self, scoring_client, authed_client_factory, caplog
    ) -> None:
        _, token, _ = authed_client_factory("sec.log.scored@example.com")
        essay = _essay_with_canary()

        with caplog.at_level(logging.DEBUG):
            response = scoring_client.post(
                "/api/v1/assessments",
                json={"task_type": "TASK_2", "essay_text": essay},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 201, response.text
        assert CANARY not in caplog.text

    def test_rejected_submission_does_not_log_the_essay(
        self, scoring_client, authed_client_factory, caplog
    ) -> None:
        """The rejection path logs word counts and reasons — never the text itself."""
        _, token, _ = authed_client_factory("sec.log.rejected@example.com")

        with caplog.at_level(logging.DEBUG):
            response = scoring_client.post(
                "/api/v1/assessments",
                json={"task_type": "TASK_2", "essay_text": f"Short essay {CANARY}."},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 400
        assert CANARY not in caplog.text

    def test_failed_scoring_does_not_log_the_essay(
        self, override_llm, authed_client_factory, caplog
    ) -> None:
        """The failure path logs the most detail, so it is the likeliest to leak."""
        _, token, _ = authed_client_factory("sec.log.failed@example.com")
        client = override_llm(
            FakeLLMClient(echo_real_quote=True, fail_nodes={"criterion:LEXICAL_RESOURCE"})
        )

        with caplog.at_level(logging.DEBUG):
            response = client.post(
                "/api/v1/assessments",
                json={"task_type": "TASK_2", "essay_text": _essay_with_canary()},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 503
        assert CANARY not in caplog.text


class TestResponsesDoNotLeak:
    def test_credentials_never_appear_in_an_assessment_response(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("sec.leak.creds@example.com")
        response = scoring_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
            headers={"Authorization": f"Bearer {token}"},
        )
        body = response.text
        for forbidden in ("password", "password_hash", "token_hash", "refresh_token"):
            assert forbidden not in body

    def test_the_model_identity_is_not_exposed_to_learners(
        self, scoring_client, authed_client_factory
    ) -> None:
        """Which upstream model scored an essay is operator information. It is stored
        on the result row for Principle IV provenance, but the contract's response
        schema does not include it."""
        _, token, _ = authed_client_factory("sec.leak.model@example.com")
        body = scoring_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
            headers={"Authorization": f"Bearer {token}"},
        ).json()

        assert "model_used" not in body
        assert "pipeline_version" not in body

    def test_another_learners_essay_is_not_readable(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, owner_token, _ = authed_client_factory("sec.owner@example.com")
        created = scoring_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": _essay_with_canary()},
            headers={"Authorization": f"Bearer {owner_token}"},
        ).json()

        _, intruder_token, _ = authed_client_factory("sec.intruder@example.com")
        response = scoring_client.get(
            f"/api/v1/assessments/{created['submission_id']}",
            headers={"Authorization": f"Bearer {intruder_token}"},
        )

        assert response.status_code == 403
        assert CANARY not in response.text
