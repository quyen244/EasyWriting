"""Contract tests for GET /api/v1/assessments/{submissionId} (T021).

Covers FR-010 (the learner can view the full explanation behind each score) and the
403/404 distinction the contract draws.
"""

from __future__ import annotations

import uuid

from tests.conftest import TASK_2_ESSAY


def _submit(client, token: str, **overrides):
    payload = {"task_type": "TASK_2", "essay_text": TASK_2_ESSAY}
    payload.update(overrides)
    return client.post(
        "/api/v1/assessments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )


def _get(client, token: str, submission_id: str):
    return client.get(
        f"/api/v1/assessments/{submission_id}",
        headers={"Authorization": f"Bearer {token}"},
    )


class TestRetrieval:
    def test_returns_the_same_result_that_was_created(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("get.roundtrip@example.com")
        created = _submit(scoring_client, token).json()

        fetched = _get(scoring_client, token, created["submission_id"])
        assert fetched.status_code == 200, fetched.text
        body = fetched.json()

        assert body["submission_id"] == created["submission_id"]
        assert body["overall_band"] == created["overall_band"]
        assert len(body["criteria"]) == 4

    def test_retrieved_result_still_carries_every_explanation(
        self, scoring_client, authed_client_factory
    ) -> None:
        """FR-010: the explanation must be viewable later, not only at scoring time."""
        _, token, _ = authed_client_factory("get.explain@example.com")
        created = _submit(scoring_client, token).json()

        criteria = _get(scoring_client, token, created["submission_id"]).json()["criteria"]
        for criterion in criteria:
            assert criterion["explanation"].strip()
            assert "descriptor_reference" in criterion


class TestAccessControl:
    def test_unauthenticated_read_is_rejected(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("get.unauth@example.com")
        created = _submit(scoring_client, token).json()

        response = scoring_client.get(f"/api/v1/assessments/{created['submission_id']}")
        assert response.status_code == 401

    def test_another_learners_submission_is_forbidden(
        self, scoring_client, authed_client_factory
    ) -> None:
        """A learner must never read someone else's essay assessment."""
        _, owner_token, _ = authed_client_factory("get.owner@example.com")
        created = _submit(scoring_client, owner_token).json()

        _, other_token, _ = authed_client_factory("get.intruder@example.com")
        response = _get(scoring_client, other_token, created["submission_id"])
        assert response.status_code == 403

    def test_unknown_submission_id_is_404(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("get.missing@example.com")
        assert _get(scoring_client, token, str(uuid.uuid4())).status_code == 404

    def test_malformed_submission_id_is_a_validation_error(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("get.malformed@example.com")
        assert _get(scoring_client, token, "not-a-uuid").status_code == 422
