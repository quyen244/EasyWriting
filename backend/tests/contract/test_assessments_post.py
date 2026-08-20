"""Contract tests for POST /api/v1/assessments (T020).

Asserts the wire format against contracts/assessments-openapi.yaml. These are the tests
that catch response-shape drift — exactly the class of bug that shipped in 003's first
draft, where errors came back as {"detail": {...}} instead of the flat body the
contract defines.
"""

from __future__ import annotations

from tests.conftest import TASK_2_ESSAY

CRITERIA_FOR_TASK_2 = {
    "TASK_RESPONSE",
    "COHERENCE_COHESION",
    "LEXICAL_RESOURCE",
    "GRAMMATICAL_RANGE_ACCURACY",
}


def _submit(client, token: str, **overrides):
    payload = {"task_type": "TASK_2", "essay_text": TASK_2_ESSAY}
    payload.update(overrides)
    return client.post(
        "/api/v1/assessments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )


class TestSuccessResponse:
    def test_returns_201_with_the_documented_body(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("post.success@example.com")
        response = _submit(scoring_client, token)

        assert response.status_code == 201, response.text
        body = response.json()
        assert set(body) >= {"submission_id", "overall_band", "criteria", "created_at"}
        assert isinstance(body["submission_id"], str)
        assert 1.0 <= body["overall_band"] <= 9.0

    def test_returns_exactly_four_criteria_matching_the_task_type(
        self, scoring_client, authed_client_factory
    ) -> None:
        """FR-005: Task 2 is scored on TASK_RESPONSE, never TASK_ACHIEVEMENT."""
        _, token, _ = authed_client_factory("post.four@example.com")
        criteria = _submit(scoring_client, token).json()["criteria"]

        assert len(criteria) == 4
        assert {c["criterion"] for c in criteria} == CRITERIA_FOR_TASK_2

    def test_task_1_uses_task_achievement_instead(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("post.task1@example.com")
        response = _submit(scoring_client, token, task_type="TASK_1")

        assert response.status_code == 201, response.text
        codes = {c["criterion"] for c in response.json()["criteria"]}
        assert "TASK_ACHIEVEMENT" in codes
        assert "TASK_RESPONSE" not in codes

    def test_every_criterion_carries_a_non_empty_explanation(
        self, scoring_client, authed_client_factory
    ) -> None:
        """FR-012 / Constitution I: no band is ever shown without its explanation."""
        _, token, _ = authed_client_factory("post.explain@example.com")
        criteria = _submit(scoring_client, token).json()["criteria"]

        for criterion in criteria:
            assert criterion["explanation"].strip(), f"{criterion['criterion']} has none"
            assert 1.0 <= criterion["band"] <= 9.0
            assert isinstance(criterion["evidence_quotes"], list)

    def test_accepts_an_optional_exam_prompt(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("post.prompt@example.com")
        response = _submit(
            scoring_client, token, prompt_text="Discuss both views and give your opinion."
        )
        assert response.status_code == 201, response.text


class TestAuthentication:
    def test_unauthenticated_submission_is_rejected(self, scoring_client) -> None:
        """FR-008: an account is required before an essay can be scored."""
        response = scoring_client.post(
            "/api/v1/assessments",
            json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
        )
        assert response.status_code == 401

    def test_garbage_bearer_token_is_rejected(self, scoring_client) -> None:
        response = _submit(scoring_client, "not-a-real-token")
        assert response.status_code == 401


class TestRequestValidation:
    def test_missing_task_type_is_a_validation_error(
        self, scoring_client, authed_client_factory
    ) -> None:
        """FR-005a: the task type is required so the correct rubric is applied."""
        _, token, _ = authed_client_factory("post.notask@example.com")
        response = scoring_client.post(
            "/api/v1/assessments",
            json={"essay_text": TASK_2_ESSAY},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 422

    def test_unknown_task_type_is_a_validation_error(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("post.badtask@example.com")
        assert _submit(scoring_client, token, task_type="TASK_9").status_code == 422

    def test_empty_essay_is_a_validation_error(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("post.empty@example.com")
        assert _submit(scoring_client, token, essay_text="").status_code == 422
