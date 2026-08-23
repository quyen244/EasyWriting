"""The Edge Function's generated assets must match eval/'s originals.

`supabase/functions/grade-attempt/generated/assets.ts` is a copy of the prompts, the
rubrics, the word lists, the response schema and the pipeline parameters. A copy is a
liability: edit a rubric here and forget to re-export, and the committed benchmark in
`eval/data/reports/` starts describing a pipeline nobody is running — silently, because
both sides still work perfectly on their own.

So the export is checked, not trusted. This test regenerates it in memory and diffs.
Failing it means one command: `cd eval && python -m scripts.export_edge_assets`.
"""

from __future__ import annotations

import pytest

from scripts.export_edge_assets import OUTPUT, render


class TestGeneratedAssetsAreCurrent:
    def test_file_exists(self) -> None:
        assert OUTPUT.is_file(), (
            f"{OUTPUT} is missing. Run: cd eval && python -m scripts.export_edge_assets"
        )

    def test_matches_a_fresh_export(self) -> None:
        current = OUTPUT.read_text(encoding="utf-8")
        if current != render():
            pytest.fail(
                "The Edge Function's generated assets are stale — eval/prompts/v3, "
                "eval/pipelines/v3.yaml or eval/src/pipeline/lexicon.py changed without "
                "a re-export. The Edge Function would score differently from the "
                "harness that benchmarked it.\n\n"
                "Fix: cd eval && python -m scripts.export_edge_assets"
            )


class TestExportedContentIsUsable:
    """Guards against an export that is fresh but wrong — a rename upstream that leaves
    the generator producing a syntactically fine file with the wrong contents in it."""

    def test_carries_the_pipeline_under_test(self) -> None:
        rendered = render()
        assert 'version: "pipeline-v3.0"' in rendered
        assert 'promptVersion: "v3"' in rendered
        # Reasoning must be off. On this model it is not a preference: with it on, every
        # criterion was truncated mid-JSON and the whole assessment failed.
        assert "reasoning: { enabled: false }" in rendered

    def test_carries_all_five_rubrics(self) -> None:
        rendered = render()
        for code in (
            "TASK_ACHIEVEMENT",
            "TASK_RESPONSE",
            "COHERENCE_COHESION",
            "LEXICAL_RESOURCE",
            "GRAMMATICAL_RANGE_ACCURACY",
        ):
            assert f"    {code}: " in rendered, f"rubric for {code} missing from export"

    def test_carries_the_language_purity_rule(self) -> None:
        """Phase A measured the model leaking Chinese and Thai into the Vietnamese
        fields. Losing this rule in transit would reintroduce a bug that has already
        been paid for once."""
        assert "MUST be written entirely in Vietnamese script" in render()

    def test_response_schema_requires_the_bilingual_fields(self) -> None:
        """`criteria_match_task()` rejects a row whose comment.en or comment.vi is
        empty, so the schema the model is constrained by must ask for them."""
        rendered = render()
        assert "CRITERION_RESPONSE_SCHEMA" in rendered
        assert '"improvement"' in rendered
        assert '"Bilingual"' in rendered
