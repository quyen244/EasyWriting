"""Criterion-evaluator prompt construction (T028, T037).

This module is now pure assembly: every word sent to the model comes from
`backend/prompts/<version>/*.txt`, selected by `prompts.version` in the active
`pipelines/*.yaml`. Changing wording, rubrics, or the model never requires editing
Python — see prompts/README.md.

This feature builds ONE prompt family: the criterion evaluator. The reference project
also had corrector and synthesizer prompts; research.md decision 3 drops both, since
they produce rewritten sentences and coaching prose belonging to the teach-to-improve
feature (Constitution II), explicitly out of scope here. That is what takes an
assessment from 6 LLM calls down to 4 (Constitution V).

The verbatim-quote requirement (US2 / FR-004) is enforced in three places at once,
because a model asked politely for quotes will still fabricate them:
  1. the prompt demands character-for-character copying and forbids invention,
  2. `CriterionEvaluation.evidence` makes quotes a required schema field, and
  3. `pipeline/verify.py` checks every returned quote against the real essay and drops
     the ones that do not appear. Only (3) is load-bearing; (1) and (2) reduce how
     often (3) has to intervene.
"""

from __future__ import annotations

from src.llm.prompts.loader import PromptSet, get_prompt_set
from src.schemas.assessment import CRITERION_NAMES, TASK_CRITERIA, TextFeatures

TASK_LABEL = {
    "TASK_1": "IELTS Academic Writing Task 1 (data/process report)",
    "TASK_2": "IELTS Writing Task 2 (argumentative essay)",
}


def format_features(f: TextFeatures) -> str:
    repeated = ", ".join(f"{w}({n})" for w, n in f.repeated_content_words) or "none detected"
    devices = ", ".join(f.cohesive_devices_found) or "none detected"
    length_flag = "MEETS minimum" if f.meets_min_words else "BELOW minimum"
    return (
        f"- Word count: {f.word_count} (minimum required: {f.min_words_required}) — {length_flag}\n"
        f"- Paragraphs: {f.paragraph_count} | Sentences: {f.sentence_count} | "
        f"Average sentence length: {f.avg_sentence_length:.1f} words\n"
        f"- Unique words: {f.unique_words} | Type-token ratio: {f.type_token_ratio:.2f}\n"
        f"- Most repeated content words: {repeated}\n"
        f"- Cohesive devices detected: {devices}"
    )


def build_criterion_messages(
    *,
    task_type: str,
    criterion: str,
    essay_text: str,
    features: TextFeatures,
    prompt_text: str | None = None,
    prompt_version: str = "v1",
    prompt_set: PromptSet | None = None,
) -> list[dict[str, str]]:
    """Build the chat messages for one criterion evaluator call.

    `prompt_set` is injectable so tests can exercise a fixture directory without
    touching the real assets; production passes only `prompt_version`.
    """
    assets = prompt_set or get_prompt_set(prompt_version)

    prompt_block = ""
    if prompt_text and prompt_text.strip():
        prompt_block = f"\n## EXAM PROMPT\n{prompt_text.strip()}\n"

    length_rule = (
        assets.length_rule_task if criterion in TASK_CRITERIA else assets.length_rule_other
    )

    return [
        {
            "role": "system",
            "content": assets.criterion_system.format(task_label=TASK_LABEL[task_type]),
        },
        {
            "role": "user",
            "content": assets.criterion_user.format(
                criterion_name=CRITERION_NAMES[criterion],
                criterion_code=criterion,
                rubric=assets.rubric_for(criterion),
                prompt_block=prompt_block,
                essay=essay_text.strip(),
                features=format_features(features),
                length_rule=length_rule,
            ),
        },
    ]
