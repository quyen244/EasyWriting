"""Deterministic text analysis (T027).

Runs before any LLM call and costs nothing. Its output is injected into every scoring
prompt as ground truth, which removes a whole class of errors that LLMs make reliably:
counting. A model asked to count words in a 300-word essay will confidently be wrong;
a model handed the count is not.

It also performs the FR-006/FR-007 scoreability gate. Both checks happen here, before
any spend, so a rejected submission costs zero LLM calls (Constitution V).

Ported from the IE AI Evaluator's `src/pipeline/preprocess.py`, plus the English/essay-
shape check that FR-007 requires and the source project did not have.
"""

from __future__ import annotations

import re
from collections import Counter

from src.pipeline.lexicon import COHESIVE_DEVICES, STOPWORDS
from src.schemas.assessment import TextFeatures
from src.utils.config import Settings, get_settings

WORD_RE = re.compile(r"\b[\w'-]+\b", re.UNICODE)
SENTENCE_SPLIT_RE = re.compile(r"[.!?]+(?:\s|$)")
PARAGRAPH_SPLIT_RE = re.compile(r"\n\s*\n")

# Latin letters vs. everything else — a cheap proxy for "is this English-ish text".
LATIN_RE = re.compile(r"[A-Za-z]")

# Below this, there is nothing meaningful to assess regardless of task type.
ABSOLUTE_MIN_WORDS = 20


def tokenize(text: str) -> list[str]:
    return WORD_RE.findall(text)


def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in SENTENCE_SPLIT_RE.split(text) if s.strip()]


def split_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in PARAGRAPH_SPLIT_RE.split(text.strip()) if p.strip()]


def find_cohesive_devices(text: str) -> list[str]:
    lowered = text.lower()
    found = []
    for device in COHESIVE_DEVICES:
        if " " in device:
            if device in lowered:
                found.append(device)
        elif re.search(rf"\b{re.escape(device)}\b", lowered):
            found.append(device)
    return found


def repeated_content_words(
    words: list[str], *, min_len: int = 4, min_count: int = 3, top_n: int = 10
) -> list[tuple[str, int]]:
    counts = Counter(
        w.lower() for w in words if len(w) >= min_len and w.lower() not in STOPWORDS
    )
    return [(w, n) for w, n in counts.most_common(top_n) if n >= min_count]


def extract_features(
    essay_text: str, task_type: str, settings: Settings | None = None
) -> TextFeatures:
    s = settings or get_settings()
    words = tokenize(essay_text)
    sentences = split_sentences(essay_text)
    paragraphs = split_paragraphs(essay_text)

    word_count = len(words)
    sentence_count = len(sentences)
    unique = len({w.lower() for w in words})
    min_required = s.min_words(task_type)
    deficit = max(0.0, (min_required - word_count) / min_required) if min_required else 0.0

    return TextFeatures(
        word_count=word_count,
        sentence_count=sentence_count,
        paragraph_count=len(paragraphs),
        avg_sentence_length=word_count / sentence_count if sentence_count else 0.0,
        unique_words=unique,
        type_token_ratio=unique / word_count if word_count else 0.0,
        repeated_content_words=repeated_content_words(words),
        cohesive_devices_found=find_cohesive_devices(essay_text),
        min_words_required=min_required,
        meets_min_words=word_count >= min_required,
        length_deficit_ratio=round(deficit, 4),
    )


def find_unscoreable_reason(essay_text: str, features: TextFeatures) -> str | None:
    """FR-007: detect submissions that cannot be scored at all.

    Returns a human-readable reason, or None if the text looks like scoreable English
    essay prose. Deliberately conservative — these heuristics reject only clear-cut
    junk (empty text, non-Latin scripts, repeated characters, near-zero vocabulary),
    because a false rejection costs a real learner their submission, while a false
    accept merely produces a low band from the rubric, which is a defensible outcome.
    """
    stripped = essay_text.strip()
    if not stripped:
        return "The submission is empty."

    if features.word_count < ABSOLUTE_MIN_WORDS:
        return (
            f"The submission contains only {features.word_count} words, which is too "
            "little to assess against the band descriptors."
        )

    # Predominantly non-Latin script -> not English (spec Assumptions: reject, don't translate).
    latin_chars = len(LATIN_RE.findall(stripped))
    alnum_chars = sum(1 for c in stripped if c.isalnum())
    if alnum_chars and (latin_chars / alnum_chars) < 0.5:
        return "The submission does not appear to be written in English."

    # Degenerate vocabulary: "aaaa aaaa aaaa" or a pasted single token repeated.
    if features.word_count >= ABSOLUTE_MIN_WORDS and features.type_token_ratio < 0.10:
        return (
            "The submission repeats the same few words and is not recognizable as "
            "essay writing."
        )

    # No sentence punctuation at all across a long text -> code dump, word salad, etc.
    if features.sentence_count <= 1 and features.word_count > 80:
        return (
            "The submission has no sentence structure and is not recognizable as "
            "essay writing."
        )

    return None
