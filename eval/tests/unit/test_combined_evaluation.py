"""pipeline-v2.0 — the single-call combined schema, prompt set, and prompt assembly
(specs/00-grading-feature). Orchestration-level tests (the actual call count, band
aggregation) live in tests/integration/test_combined_score_assessment_flow.py,
mirroring where v1's equivalents live.
"""

from __future__ import annotations

import pytest

from src.llm.prompts.builders import build_combined_messages
from src.llm.prompts.loader import PromptAssetError, load_combined_prompt_set
from src.pipeline.config import load_pipeline_config
from src.pipeline.preprocess import extract_features
from src.schemas.assessment import (
    CombinedEvaluationTask1,
    CombinedEvaluationTask2,
    combined_field_for,
    combined_response_model_for,
)
from tests.conftest import TASK_2_ESSAY

# Short TASK_1 fixture, local to this file — the golden set's essays are held out of
# the few-shot example on purpose (loader.py's CombinedPromptSet docstring), and
# reusing one here would blur that same boundary for no reason.
TASK_1_ESSAY = """\
The bar chart shows the number of visitors to three museums in a European city in
2010 and 2020.

Overall, the National Gallery remained the most visited museum in both years, while
the History Museum saw the largest increase.

In 2010, the National Gallery welcomed around 800,000 visitors, more than double the
History Museum's 350,000. The Science Centre attracted 500,000 visitors, placing it
between the other two.

By 2020, the National Gallery had grown modestly to 900,000 visitors. The History
Museum, however, more than doubled its numbers to reach 720,000, narrowing the gap
with the National Gallery considerably. The Science Centre grew only slightly, to
550,000, and fell to third place.
"""


class TestSchemaSelection:
    def test_task_type_selects_the_right_named_fields(self) -> None:
        """The first field's NAME carries the first criterion's code — there is no
        separate `code` value the model could get wrong or return out of order."""
        assert combined_response_model_for("TASK_1") is CombinedEvaluationTask1
        assert combined_response_model_for("TASK_2") is CombinedEvaluationTask2
        assert set(CombinedEvaluationTask1.model_fields) == {
            "task_achievement", "coherence_cohesion", "lexical_resource",
            "grammatical_range_accuracy",
        }
        assert set(CombinedEvaluationTask2.model_fields) == {
            "task_response", "coherence_cohesion", "lexical_resource",
            "grammatical_range_accuracy",
        }

    def test_combined_field_for_matches_schema_field_names(self) -> None:
        assert combined_field_for("TASK_ACHIEVEMENT") == "task_achievement"
        assert combined_field_for("GRAMMATICAL_RANGE_ACCURACY") == "grammatical_range_accuracy"


class TestCombinedPromptSetLoading:
    def test_v2_loads_with_a_few_shot_example_per_task_type(self) -> None:
        prompt_set = load_combined_prompt_set("v2")
        assert prompt_set.few_shot_input.keys() == {"TASK_1", "TASK_2"}
        assert prompt_set.few_shot_output.keys() == {"TASK_1", "TASK_2"}
        assert all(text.strip() for text in prompt_set.few_shot_input.values())
        assert all(text.strip() for text in prompt_set.few_shot_output.values())

    def test_few_shot_examples_are_not_drawn_from_the_golden_set(self) -> None:
        """Sourcing a few-shot example from eval/data/golden/ would leak that essay's
        answer into its own benchmark comparison — this is why they are hand-built
        instead (loader.py's CombinedPromptSet docstring)."""
        prompt_set = load_combined_prompt_set("v2")
        golden_ids = {"T1-001", "T1-002", "T2-001", "T2-002"}  # spot-check, not exhaustive
        for text in prompt_set.few_shot_input.values():
            for golden_id in golden_ids:
                assert golden_id not in text

    def test_unknown_version_fails_loudly(self) -> None:
        with pytest.raises(PromptAssetError, match="No prompt version"):
            load_combined_prompt_set("v-does-not-exist")


class TestCombinedPromptRendering:
    def test_every_placeholder_is_substituted(self) -> None:
        features = extract_features(TASK_2_ESSAY, "TASK_2")
        messages = build_combined_messages(
            task_type="TASK_2", essay_text=TASK_2_ESSAY, features=features
        )
        rendered = "".join(m["content"] for m in messages)
        for placeholder in (
            "{rubric_block}", "{prompt_block}", "{essay}", "{features}",
            "{first_criterion_field}", "{first_criterion_code}", "{first_criterion_name}",
            "{task_label}",
        ):
            assert placeholder not in rendered

    def test_returns_four_messages_system_then_few_shot_pair_then_real_request(self) -> None:
        features = extract_features(TASK_2_ESSAY, "TASK_2")
        messages = build_combined_messages(
            task_type="TASK_2", essay_text=TASK_2_ESSAY, features=features
        )
        assert [m["role"] for m in messages] == ["system", "user", "assistant", "user"]
        # The few-shot pair must not be the real essay.
        assert TASK_2_ESSAY.strip()[:40] not in messages[1]["content"]
        assert TASK_2_ESSAY.strip()[:40] in messages[3]["content"]

    def test_all_four_rubrics_for_the_task_type_are_present(self) -> None:
        features = extract_features(TASK_2_ESSAY, "TASK_2")
        real_request = build_combined_messages(
            task_type="TASK_2", essay_text=TASK_2_ESSAY, features=features
        )[3]["content"]
        assert "TASK_RESPONSE" in real_request
        assert "TASK_ACHIEVEMENT" not in real_request, "wrong task's first criterion leaked"
        assert "COHERENCE_COHESION" in real_request
        assert "LEXICAL_RESOURCE" in real_request
        assert "GRAMMATICAL_RANGE_ACCURACY" in real_request

    def test_first_criterion_field_matches_task_type(self) -> None:
        features1 = extract_features(TASK_1_ESSAY, "TASK_1")
        real1 = build_combined_messages(
            task_type="TASK_1", essay_text=TASK_1_ESSAY, features=features1
        )[3]["content"]
        assert "`task_achievement`" in real1

        features2 = extract_features(TASK_2_ESSAY, "TASK_2")
        real2 = build_combined_messages(
            task_type="TASK_2", essay_text=TASK_2_ESSAY, features=features2
        )[3]["content"]
        assert "`task_response`" in real2


class TestV2PipelineConfig:
    def test_v2_config_loads_in_single_call_mode(self) -> None:
        config = load_pipeline_config("pipelines/v2.yaml")
        assert config.version == "pipeline-v2.0"
        assert config.call_mode == "single_call"
        assert config.prompts.version == "v2"

    def test_v1_config_defaults_to_per_criterion_unchanged(self) -> None:
        """v1.yaml was never edited for this feature — its config must still resolve
        to the old orchestration mode without any change to that file."""
        config = load_pipeline_config("pipelines/v1.yaml")
        assert config.call_mode == "per_criterion"
