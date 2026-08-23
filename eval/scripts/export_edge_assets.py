"""Generate the Edge Function's copy of the scoring assets from eval/'s originals.

The Edge Function and the evaluation harness must score identically, or the benchmark
in `eval/data/reports/` describes something other than what learners actually get. The
risk is not that someone rewrites the logic — it is that someone tweaks a rubric, a
stopword, or `max_tokens` on one side and forgets the other, and nothing complains.

So the prompt text, the word lists and the pipeline parameters have exactly one source
of truth — `eval/prompts/v3/` and `eval/pipelines/v3.yaml` — and this script copies
them into a generated TypeScript module the Edge Function imports. Nothing here is
translated or reinterpreted; it is the same bytes in a different file format.

`tests/unit/test_edge_assets_export.py` regenerates and diffs, so drift fails the test
suite rather than being discovered in production.

Usage:  python -m scripts.export_edge_assets      (from eval/)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml

EVAL_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = EVAL_ROOT.parent
OUTPUT = REPO_ROOT / "supabase" / "functions" / "grade-attempt" / "generated" / "assets.ts"

PIPELINE_YAML = EVAL_ROOT / "pipelines" / "v3.yaml"

HEADER = """// GENERATED FILE — DO NOT EDIT BY HAND.
//
// Produced by `eval/scripts/export_edge_assets.py` from:
//   eval/pipelines/{pipeline_yaml}
//   eval/prompts/{prompt_version}/**
//   eval/src/pipeline/lexicon.py
//
// Edit those, then re-run:  cd eval && python -m scripts.export_edge_assets
//
// Why this file exists: the Edge Function must score identically to the harness that
// benchmarked the pipeline, and a rubric edited on one side only would silently make
// the committed accuracy numbers describe a pipeline nobody is running.
"""


def _ts_string(value: str) -> str:
    """Emit a JS string literal. JSON's escaping is a strict subset of JS's, so
    `json.dumps` is both correct and safe here — including for the Vietnamese text and
    the `{placeholder}` braces, which are literal in a plain-quoted string."""
    return json.dumps(value, ensure_ascii=False)


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def render() -> str:
    config = yaml.safe_load(_read(PIPELINE_YAML))
    prompt_version = config["prompts"]["version"]
    prompt_dir = EVAL_ROOT / "prompts" / prompt_version
    rubric_dir = prompt_dir / "rubrics"

    # Imported rather than re-listed: the lexicon is data the preprocessor depends on,
    # and a hand-copied word list is exactly the kind of thing that drifts unnoticed.
    # The response schema is imported for a stronger reason — it is the exact object
    # sent to OpenRouter as `response_format.json_schema.schema`, so hand-writing a
    # TypeScript "equivalent" would mean the Edge Function constrains the model
    # differently from the harness that measured it.
    sys.path.insert(0, str(EVAL_ROOT))
    from src.pipeline.lexicon import COHESIVE_DEVICES, STOPWORDS  # noqa: E402
    from src.schemas.assessment import (  # noqa: E402
        CRITERIA_BY_TASK,
        CRITERION_NAMES,
        TASK_CRITERIA,
        CombinedCriterionBlock,
    )

    lines = [
        HEADER.format(
            pipeline_yaml=PIPELINE_YAML.name,
            prompt_version=prompt_version,
        ),
        "",
        "export const PIPELINE = {",
        f"  version: {_ts_string(config['version'])},",
        "  model: {",
        f"    id: {_ts_string(config['model']['id'])},",
        f"    temperature: {config['model']['temperature']},",
        f"    maxTokens: {config['model']['max_tokens']},",
        f"    seed: {config['model'].get('seed', 'null')},",
        f"    timeoutMs: {config['model']['timeout_s'] * 1000},",
        f"    maxRetries: {config['model']['max_retries']},",
        "    // Must stay false on a reasoning model: reasoning tokens are billed output",
        "    // tokens charged against maxTokens, and turning them on truncated every",
        "    // response mid-JSON when last measured (eval/pipelines/v1.yaml).",
        f"    reasoning: {{ enabled: {str(config['model']['reasoning']['enabled']).lower()} }},",
        "  },",
        f"  promptVersion: {_ts_string(prompt_version)},",
        "  lengthPenalty: {",
    ]
    lp = config["scoring"]["length_penalty"]
    lines += [
        f"    moderateDeficitRatio: {lp['moderate_deficit_ratio']},",
        f"    moderatePenalty: {lp['moderate_penalty']},",
        f"    severeDeficitRatio: {lp['severe_deficit_ratio']},",
        f"    severePenalty: {lp['severe_penalty']},",
        "  },",
        "} as const;",
        "",
        "export const PROMPTS = {",
        f"  criterionSystem: {_ts_string(_read(prompt_dir / 'criterion_system.txt'))},",
        f"  criterionUser: {_ts_string(_read(prompt_dir / 'criterion_user.txt'))},",
        f"  lengthRuleTask: {_ts_string(_read(prompt_dir / 'length_rule_task.txt'))},",
        f"  lengthRuleOther: {_ts_string(_read(prompt_dir / 'length_rule_other.txt'))},",
        "  rubrics: {",
    ]
    for rubric in sorted(rubric_dir.glob("*.txt")):
        lines.append(f"    {rubric.stem}: {_ts_string(_read(rubric))},")
    lines += [
        "  } as Record<string, string>,",
        "} as const;",
        "",
        "// Deterministic-preprocessor word lists. Data, not logic.",
        "export const STOPWORDS: ReadonlySet<string> = new Set([",
    ]
    for word in sorted(STOPWORDS):
        lines.append(f"  {_ts_string(word)},")
    lines += [
        "]);",
        "",
        "// Multi-word entries are matched as phrases, single words as whole words.",
        "export const COHESIVE_DEVICES: readonly string[] = [",
    ]
    # Source order, not sorted: `find_cohesive_devices` reports them in list order and
    # that order ends up in the prompt the model reads.
    for device in COHESIVE_DEVICES:
        lines.append(f"  {_ts_string(device)},")
    lines += ["];", ""]

    # ── Criterion tables ──────────────────────────────────────────────────────
    lines += [
        "// The four criteria, in the fixed order `criteria_match_task()` requires for",
        "// each task type. The task criterion is named differently per task; the other",
        "// three are identical. Reordering this breaks the database constraint, not just",
        "// the display.",
        "export const CRITERIA_BY_TASK: Record<string, readonly string[]> = {",
    ]
    for task, codes in CRITERIA_BY_TASK.items():
        rendered = ", ".join(_ts_string(c) for c in codes)
        lines.append(f"  {task}: [{rendered}],")
    lines += [
        "};",
        "",
        "export const CRITERION_NAMES: Record<string, string> = {",
    ]
    for code, name in CRITERION_NAMES.items():
        lines.append(f"  {code}: {_ts_string(name)},")
    lines += [
        "};",
        "",
        "// The criteria that absorb the under-length penalty — one per task type, never",
        "// all four, so a short essay is not marked down four times for one shortcoming.",
        f"export const TASK_CRITERIA: ReadonlySet<string> = new Set([{', '.join(_ts_string(c) for c in sorted(TASK_CRITERIA))}]);",
        "",
        "// Byte-for-byte what the harness sends as response_format.json_schema.schema.",
        "export const CRITERION_RESPONSE_SCHEMA =",
        _indent_json(CombinedCriterionBlock.model_json_schema()) + " as const;",
        "",
    ]

    return "\n".join(lines)


def _indent_json(obj: object) -> str:
    return "\n".join(
        "  " + line if line else line
        for line in json.dumps(obj, indent=2, ensure_ascii=False).split("\n")
    ).lstrip()


def main() -> int:
    content = render()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content, encoding="utf-8", newline="\n")
    print(f"Wrote {OUTPUT.relative_to(REPO_ROOT)} ({len(content)} chars)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
