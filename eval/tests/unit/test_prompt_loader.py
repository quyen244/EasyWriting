"""Versioned prompt/rubric assets and the YAML-driven config.

The design contract being tested: changing the model, its parameters, or the entire
prompt+rubric set is a YAML edit plus a directory copy — never a Python edit. These
tests fail if that stops being true.
"""

from __future__ import annotations

import shutil

import pytest
import yaml

from src.llm.prompts.builders import build_criterion_messages
from src.llm.prompts.loader import PromptAssetError, load_prompt_set
from src.pipeline.config import PipelineConfigError, load_pipeline_config
from src.pipeline.preprocess import extract_features
from src.schemas.assessment import CRITERION_NAMES
from tests.conftest import TASK_2_ESSAY

BACKEND_ROOT = __import__("pathlib").Path(__file__).resolve().parents[2]
PROMPTS_ROOT = BACKEND_ROOT / "prompts"


class TestPromptSetLoading:
    def test_v1_provides_a_rubric_for_every_criterion(self) -> None:
        """A missing rubric would silently score a criterion against nothing."""
        prompt_set = load_prompt_set("v1")
        assert set(prompt_set.rubrics) == set(CRITERION_NAMES)
        assert all(text.strip() for text in prompt_set.rubrics.values())

    def test_rubrics_retain_the_band_discriminators(self) -> None:
        """The compressed descriptors are only useful if they keep the language that
        separates adjacent bands — that is what stops a model scoring everything 6.5."""
        prompt_set = load_prompt_set("v1")
        for code, text in prompt_set.rubrics.items():
            assert "DISCRIMINATOR" in text, f"{code} lost its discriminator"
            assert "Band 9" in text and "Band 4" in text

    def test_unknown_version_fails_loudly(self) -> None:
        with pytest.raises(PromptAssetError, match="No prompt version"):
            load_prompt_set("v-does-not-exist")

    def test_incomplete_version_lists_exactly_what_is_missing(self, tmp_path) -> None:
        """A half-finished `cp -r prompts/v1 prompts/v2` must fail at load time with an
        actionable message, not score essays against absent assets."""
        shutil.copytree(PROMPTS_ROOT / "v1", tmp_path / "v2")
        (tmp_path / "v2" / "criterion_user.txt").unlink()
        (tmp_path / "v2" / "rubrics" / "LEXICAL_RESOURCE.txt").unlink()

        with pytest.raises(PromptAssetError) as exc_info:
            load_prompt_set("v2", prompts_root=tmp_path)

        message = str(exc_info.value)
        assert "criterion_user.txt" in message
        assert "rubrics/LEXICAL_RESOURCE.txt" in message


class TestPromptRendering:
    def test_every_placeholder_is_substituted(self) -> None:
        """An unrendered `{essay}` would send the model a literal brace instead of the
        learner's work — and would look plausible in logs."""
        features = extract_features(TASK_2_ESSAY, "TASK_2")
        messages = build_criterion_messages(
            task_type="TASK_2",
            criterion="LEXICAL_RESOURCE",
            essay_text=TASK_2_ESSAY,
            features=features,
        )
        rendered = messages[0]["content"] + messages[1]["content"]
        for placeholder in (
            "{criterion_name}",
            "{criterion_code}",
            "{rubric}",
            "{essay}",
            "{features}",
            "{length_rule}",
            "{prompt_block}",
            "{task_label}",
        ):
            assert placeholder not in rendered

    def test_the_essay_and_matching_rubric_reach_the_model(self) -> None:
        features = extract_features(TASK_2_ESSAY, "TASK_2")
        user = build_criterion_messages(
            task_type="TASK_2",
            criterion="LEXICAL_RESOURCE",
            essay_text=TASK_2_ESSAY,
            features=features,
        )[1]["content"]

        assert "social media has fundamentally reshaped" in user
        assert "Uses a WIDE RANGE of vocabulary" in user, "LR rubric missing"
        assert "Presents a CLEAR POSITION THROUGHOUT" not in user, "wrong rubric leaked"

    def test_task_criteria_get_the_do_not_double_penalise_rule(self) -> None:
        """The length deduction is applied in code; the prompt must tell the model not
        to apply it again. These two halves must stay in sync."""
        features = extract_features(TASK_2_ESSAY, "TASK_2")

        def user_for(criterion: str) -> str:
            return build_criterion_messages(
                task_type="TASK_2",
                criterion=criterion,
                essay_text=TASK_2_ESSAY,
                features=features,
            )[1]["content"]

        assert "penalise the student twice" in user_for("TASK_RESPONSE")
        assert "Ignore essay length entirely" in user_for("LEXICAL_RESOURCE")

    def test_optional_exam_prompt_is_omitted_when_absent(self) -> None:
        features = extract_features(TASK_2_ESSAY, "TASK_2")
        without = build_criterion_messages(
            task_type="TASK_2",
            criterion="TASK_RESPONSE",
            essay_text=TASK_2_ESSAY,
            features=features,
        )[1]["content"]
        with_prompt = build_criterion_messages(
            task_type="TASK_2",
            criterion="TASK_RESPONSE",
            essay_text=TASK_2_ESSAY,
            features=features,
            prompt_text="Discuss both views and give your own opinion.",
        )[1]["content"]

        assert "## EXAM PROMPT" not in without
        assert "Discuss both views" in with_prompt


class TestPipelineConfig:
    def test_v1_config_loads_and_selects_prompt_assets(self) -> None:
        config = load_pipeline_config("pipelines/v1.yaml")
        assert config.version == "pipeline-v1.0"
        assert config.prompts.version == "v1"
        assert config.model.id
        assert 0.0 <= config.model.temperature <= 2.0

    def test_swapping_model_and_prompts_needs_no_code_change(self, tmp_path) -> None:
        """The whole point of the YAML: point it at a different model and a different
        prompt directory, and scoring changes accordingly."""
        shutil.copytree(PROMPTS_ROOT / "v1", tmp_path / "v2")
        (tmp_path / "v2" / "criterion_system.txt").write_text(
            "You are a STRICT examiner assessing {task_label}.", encoding="utf-8"
        )

        raw = yaml.safe_load((BACKEND_ROOT / "pipelines" / "v1.yaml").read_text("utf-8"))
        raw["model"]["id"] = "anthropic/claude-sonnet-4"
        raw["model"]["temperature"] = 0.0
        raw["prompts"]["version"] = "v2"
        config_path = tmp_path / "v2.yaml"
        config_path.write_text(yaml.safe_dump(raw), encoding="utf-8")

        config = load_pipeline_config(config_path)
        assert config.model.id == "anthropic/claude-sonnet-4"
        assert config.model.temperature == 0.0

        prompt_set = load_prompt_set(config.prompts.version, prompts_root=tmp_path)
        messages = build_criterion_messages(
            task_type="TASK_2",
            criterion="TASK_RESPONSE",
            essay_text=TASK_2_ESSAY,
            features=extract_features(TASK_2_ESSAY, "TASK_2"),
            prompt_set=prompt_set,
        )
        assert messages[0]["content"].startswith("You are a STRICT examiner")

    def test_missing_config_file_fails_loudly(self) -> None:
        with pytest.raises(PipelineConfigError, match="not found"):
            load_pipeline_config("pipelines/does-not-exist.yaml")

    def test_invalid_config_values_are_rejected(self, tmp_path) -> None:
        """A typo that silently scored every essay at the wrong temperature would
        poison the Principle IV benchmark comparison."""
        raw = yaml.safe_load((BACKEND_ROOT / "pipelines" / "v1.yaml").read_text("utf-8"))
        raw["model"]["temperature"] = 99.0
        bad = tmp_path / "bad.yaml"
        bad.write_text(yaml.safe_dump(raw), encoding="utf-8")

        with pytest.raises(PipelineConfigError, match="failed validation"):
            load_pipeline_config(bad)
