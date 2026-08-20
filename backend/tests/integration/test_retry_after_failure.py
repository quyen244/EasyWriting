"""User Story 3 — retry after a scoring failure (T040).

FR-009's promise: a failed scoring attempt never costs the learner their essay, and
resubmitting the same text works. Per data-model.md's State Transitions a retry is a
NEW submission row, not a mutation of the failed one — so what this verifies is that
no server-side state left behind by the failure can block the second attempt.
"""

from __future__ import annotations

from src.models import EssaySubmission, SubmissionStatus
from tests.conftest import REAL_QUOTE, TASK_2_ESSAY
from tests.fakes.fake_llm_client import FakeLLMClient


def _submit(client, token: str):
    return client.post(
        "/api/v1/assessments",
        json={"task_type": "TASK_2", "essay_text": TASK_2_ESSAY},
        headers={"Authorization": f"Bearer {token}"},
    )


class TestScoringFailure:
    def test_upstream_failure_returns_the_documented_503(
        self, override_llm, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("retry.503@example.com")
        client = override_llm(
            FakeLLMClient(quote=REAL_QUOTE, fail_nodes={"criterion:LEXICAL_RESOURCE"})
        )

        response = _submit(client, token)
        assert response.status_code == 503
        body = response.json()
        assert body["error"] == "SCORING_FAILED"
        assert "detail" not in body

    def test_the_503_body_does_not_leak_upstream_error_detail(
        self, override_llm, authed_client_factory
    ) -> None:
        """Provider errors are operator information. A learner sees a plain message."""
        _, token, _ = authed_client_factory("retry.noleak@example.com")
        client = override_llm(
            FakeLLMClient(quote=REAL_QUOTE, fail_nodes={"criterion:LEXICAL_RESOURCE"})
        )

        message = _submit(client, token).json()["message"]
        assert "forced failure" not in message
        assert "LEXICAL_RESOURCE" not in message

    def test_the_essay_survives_a_failed_attempt(
        self, override_llm, authed_client_factory, db_session
    ) -> None:
        _, token, account = authed_client_factory("retry.survive@example.com")
        client = override_llm(
            FakeLLMClient(quote=REAL_QUOTE, fail_nodes={"criterion:LEXICAL_RESOURCE"})
        )
        _submit(client, token)

        submission = (
            db_session.query(EssaySubmission)
            .filter(EssaySubmission.user_id == account["id"])
            .one()
        )
        assert submission.status is SubmissionStatus.FAILED
        assert submission.essay_text == TASK_2_ESSAY
        assert submission.result is None
        # Diagnostic detail is kept server-side even though it is not returned.
        assert "LEXICAL_RESOURCE" in (submission.failure_detail or "")


class TestRetrySucceeds:
    def test_resubmitting_the_same_text_after_a_failure_succeeds(
        self, override_llm, authed_client_factory
    ) -> None:
        """The core FR-009 guarantee: nothing about the failed attempt blocks a retry."""
        _, token, _ = authed_client_factory("retry.success@example.com")

        failing = override_llm(
            FakeLLMClient(quote=REAL_QUOTE, fail_nodes={"criterion:LEXICAL_RESOURCE"})
        )
        assert _submit(failing, token).status_code == 503

        # Upstream recovers; the learner resubmits identical text.
        recovered = override_llm(FakeLLMClient(band=6.5, quote=REAL_QUOTE))
        retry = _submit(recovered, token)

        assert retry.status_code == 201, retry.text
        assert len(retry.json()["criteria"]) == 4

    def test_a_retry_creates_a_second_submission_rather_than_mutating_the_first(
        self, override_llm, authed_client_factory, db_session
    ) -> None:
        """data-model.md: status is terminal per attempt, so the audit trail keeps
        both the failure and the success."""
        _, token, account = authed_client_factory("retry.tworows@example.com")

        failing = override_llm(
            FakeLLMClient(quote=REAL_QUOTE, fail_nodes={"criterion:LEXICAL_RESOURCE"})
        )
        _submit(failing, token)
        recovered = override_llm(FakeLLMClient(band=6.5, quote=REAL_QUOTE))
        _submit(recovered, token)

        submissions = (
            db_session.query(EssaySubmission)
            .filter(EssaySubmission.user_id == account["id"])
            .all()
        )
        assert len(submissions) == 2
        assert {s.status for s in submissions} == {
            SubmissionStatus.FAILED,
            SubmissionStatus.SCORED,
        }

    def test_identical_text_submitted_twice_is_allowed(
        self, scoring_client, authed_client_factory
    ) -> None:
        """Edge case from the spec: resubmitting the same essay is not an error."""
        _, token, _ = authed_client_factory("retry.duplicate@example.com")

        first = _submit(scoring_client, token)
        second = _submit(scoring_client, token)

        assert first.status_code == 201 and second.status_code == 201
        assert first.json()["submission_id"] != second.json()["submission_id"]
