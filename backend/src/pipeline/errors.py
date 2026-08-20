"""Assessment domain errors (T034, T041).

Mirrors the pattern 003 established for auth: typed exceptions each carrying their own
`error_code` and `status_code`, translated by ONE handler in main.py into the flat
`{error, message, ...}` body the OpenAPI contract defines.

This exists because the obvious alternative — raising `HTTPException(detail={...})` —
produces `{"detail": {...}}`, a nested shape the contract does not define. That exact
bug shipped in 003's first draft and was only caught by a contract test; encoding the
mapping in the exception type prevents it recurring here.
"""

from __future__ import annotations


class AssessmentDomainError(Exception):
    """Base for assessment failures that map to a documented error response."""

    error_code: str
    status_code: int


class SubmissionRejectedError(AssessmentDomainError):
    """400 — the submission cannot be scored as-is (FR-006, FR-007)."""

    status_code = 400


class BelowMinWordsError(SubmissionRejectedError):
    error_code = "BELOW_MIN_WORDS"

    def __init__(self, minimum_words: int, word_count: int) -> None:
        self.minimum_words = minimum_words
        self.word_count = word_count
        super().__init__(
            f"This task requires at least {minimum_words} words; your essay has "
            f"{word_count}. Your text has not been discarded — add more and resubmit."
        )


class UnscoreableError(SubmissionRejectedError):
    error_code = "UNSCOREABLE"

    def __init__(self, reason: str) -> None:
        super().__init__(reason)


class SubmissionForbiddenError(AssessmentDomainError):
    """403 — the submission exists but belongs to a different account."""

    error_code = "FORBIDDEN"
    status_code = 403

    def __init__(self) -> None:
        super().__init__("This submission belongs to a different account.")


class AssessmentNotFoundError(AssessmentDomainError):
    """404 — no such submission, or it has no result (it was rejected or failed).

    Deliberately does NOT distinguish those two cases in the response: telling an
    unauthenticated-but-curious caller that a given UUID exists-but-has-no-result
    leaks information about other accounts' activity for no user benefit.
    """

    error_code = "NOT_FOUND"
    status_code = 404

    def __init__(self) -> None:
        super().__init__("No assessment result exists for this submission.")


class ScoringFailedError(AssessmentDomainError):
    """503 — the pipeline could not produce a complete, presentable result.

    Carries per-criterion `failures` for logging. They are deliberately NOT surfaced to
    the learner: the contract's 503 body is a fixed generic message, and upstream model
    errors are operator information, not learner information.
    """

    error_code = "SCORING_FAILED"
    status_code = 503

    def __init__(
        self,
        message: str = (
            "Scoring could not be completed. Your essay was not lost — please try again."
        ),
        *,
        failures: list[str] | None = None,
    ) -> None:
        self.failures = failures or []
        super().__init__(message)
