"""User Story 3 — clear, actionable rejections (T039).

Covers the two 400 responses in contracts/assessments-openapi.yaml. The essential
promise being tested (FR-006, FR-009) is that a rejection tells the learner what to fix
and never destroys what they wrote.
"""

from __future__ import annotations

from src.models import EssaySubmission, RejectionReason, SubmissionStatus
from tests.conftest import TASK_2_ESSAY

SHORT_ESSAY = (
    "Many people think that studying abroad is beneficial for young students. "
    "I agree with this opinion because it develops independence and language skills. "
    "Living in another country forces students to solve problems on their own. "
)  # ~40 words — well under the 250-word Task 2 minimum


def _submit(client, token: str, essay: str, task_type: str = "TASK_2"):
    return client.post(
        "/api/v1/assessments",
        json={"task_type": task_type, "essay_text": essay},
        headers={"Authorization": f"Bearer {token}"},
    )


class TestBelowMinimumWords:
    def test_returns_400_with_the_documented_error_body(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("reject.short@example.com")
        response = _submit(scoring_client, token, SHORT_ESSAY)

        assert response.status_code == 400
        body = response.json()
        assert body["error"] == "BELOW_MIN_WORDS"
        assert body["message"]
        # Flat body, not FastAPI's nested {"detail": ...} — the contract's shape.
        assert "detail" not in body

    def test_states_the_minimum_so_the_learner_knows_the_target(
        self, scoring_client, authed_client_factory
    ) -> None:
        """FR-006 requires stating the minimum, not just refusing."""
        _, token, _ = authed_client_factory("reject.minimum@example.com")
        body = _submit(scoring_client, token, SHORT_ESSAY).json()
        assert body["minimum_words"] == 250

    def test_task_1_has_a_lower_minimum_than_task_2(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("reject.task1min@example.com")
        body = _submit(scoring_client, token, SHORT_ESSAY, task_type="TASK_1").json()
        assert body["minimum_words"] == 150

    def test_the_learners_text_is_preserved_server_side(
        self, scoring_client, authed_client_factory, db_session
    ) -> None:
        """FR-006/FR-009: rejection must never mean the essay was thrown away."""
        _, token, account = authed_client_factory("reject.preserve@example.com")
        _submit(scoring_client, token, SHORT_ESSAY)

        submission = (
            db_session.query(EssaySubmission)
            .filter(EssaySubmission.user_id == account["id"])
            .one()
        )
        assert submission.essay_text == SHORT_ESSAY
        assert submission.status is SubmissionStatus.REJECTED
        assert submission.rejection_reason is RejectionReason.BELOW_MIN_WORDS

    def test_no_result_row_is_created_for_a_rejected_submission(
        self, scoring_client, authed_client_factory, db_session
    ) -> None:
        _, token, account = authed_client_factory("reject.noresult@example.com")
        _submit(scoring_client, token, SHORT_ESSAY)

        submission = (
            db_session.query(EssaySubmission)
            .filter(EssaySubmission.user_id == account["id"])
            .one()
        )
        assert submission.result is None

    def test_rejection_costs_zero_llm_calls(
        self, override_llm, authed_client_factory
    ) -> None:
        """Constitution V: an essay we already know we cannot score must not be sent
        to a paid model."""
        from tests.fakes.fake_llm_client import FakeLLMClient

        fake = FakeLLMClient()
        _, token, _ = authed_client_factory("reject.nospend@example.com")
        client = override_llm(fake)

        response = _submit(client, token, SHORT_ESSAY)
        assert response.status_code == 400
        assert fake.calls == [], "a rejected submission must not reach the model"


class TestUnscoreableContent:
    def test_non_english_submission_is_rejected_as_unscoreable(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("reject.nonenglish@example.com")
        response = _submit(scoring_client, token, "这是一篇很长的中文文章。" * 40)

        assert response.status_code == 400
        assert response.json()["error"] == "UNSCOREABLE"

    def test_gibberish_is_rejected_as_unscoreable(
        self, scoring_client, authed_client_factory
    ) -> None:
        _, token, _ = authed_client_factory("reject.gibberish@example.com")
        response = _submit(scoring_client, token, "asdf " * 200)

        assert response.status_code == 400
        assert response.json()["error"] == "UNSCOREABLE"

    def test_unscoreable_body_omits_minimum_words(
        self, scoring_client, authed_client_factory
    ) -> None:
        """The contract marks minimum_words as present only for BELOW_MIN_WORDS."""
        _, token, _ = authed_client_factory("reject.nomin@example.com")
        body = _submit(scoring_client, token, "asdf " * 200).json()
        assert "minimum_words" not in body

    def test_a_valid_essay_is_not_rejected(
        self, scoring_client, authed_client_factory
    ) -> None:
        """Guards against an over-eager gate rejecting real work."""
        _, token, _ = authed_client_factory("reject.valid@example.com")
        assert _submit(scoring_client, token, TASK_2_ESSAY).status_code == 201
