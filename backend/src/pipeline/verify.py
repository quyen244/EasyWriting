"""Quote-fidelity verification (T030, T038).

Every claim the model makes about the essay must be anchored to text that actually
exists in it. Verification is exact substring match after normalisation — deliberately
NOT fuzzy. Fuzzy matching would paper over fabrication; exact matching yields an honest
quote-fidelity number telling us how often the model invents evidence, which is the
metric that makes User Story 2's credibility claim testable rather than aspirational.

T038 (US2) is the `drop_unverified_quotes` half: unverifiable quotes are removed before
persistence, so a stored AssessmentResult never contains a quote that isn't in the
learner's essay. A criterion whose quotes were ALL fabricated still keeps its band and
explanation — the band came from the rubric-grounded justification, not the quotes —
but it surfaces with an empty `evidence_quotes` list rather than a fictional one.
"""

from __future__ import annotations

import re

_SMART_QUOTES = str.maketrans(
    {
        "‘": "'",
        "’": "'",
        "“": '"',
        "”": '"',
        "–": "-",
        "—": "-",
        "…": "...",
        " ": " ",
    }
)
_WS_RE = re.compile(r"\s+")

# A one- to three-character "quote" would match almost any essay trivially and tells
# us nothing about whether the model actually read the text.
MIN_QUOTE_LENGTH = 4


def normalize(text: str) -> str:
    return _WS_RE.sub(" ", text.translate(_SMART_QUOTES).lower()).strip()


def quote_in_essay(quote: str, essay_normalized: str) -> bool:
    q = normalize(quote)
    if len(q) < MIN_QUOTE_LENGTH:
        return False
    return q in essay_normalized


def drop_unverified_quotes(quotes: list[str], essay_text: str) -> tuple[list[str], int]:
    """Filter a criterion's quotes down to those genuinely present in the essay.

    Returns (verified_quotes, dropped_count). The count feeds the quote-fidelity
    telemetry that the evaluation harness reports on (SC-003).
    """
    essay_normalized = normalize(essay_text)
    verified = [q for q in quotes if quote_in_essay(q, essay_normalized)]
    return verified, len(quotes) - len(verified)
