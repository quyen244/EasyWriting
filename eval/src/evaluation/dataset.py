"""Golden-dataset loading (T018, Constitution Principle IV).

The golden set is human-labelled ground truth: essays paired with the bands a
qualified rater assigned. It is the only thing that makes "did this prompt change
help?" an empirical question rather than an opinion, which is exactly what Principle IV
requires before any methodology change ships.

Stored as version-controlled JSON under `backend/data/golden/`, not in the database —
these are audit/methodology artifacts, not application data (plan.md Storage).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from src.schemas.assessment import CRITERIA_BY_TASK, TaskType

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GOLDEN_DIR = BACKEND_ROOT / "data" / "golden"


class GoldLabel(BaseModel):
    """What a human rater assigned. `confidence` records how sure they were, so a
    low-confidence label can be down-weighted or excluded later."""

    overall: float = Field(ge=1.0, le=9.0)
    criteria: dict[str, float]
    source: str
    confidence: Literal["high", "medium", "low"] = "medium"


class GoldenEssay(BaseModel):
    essay_id: str
    task_type: TaskType
    topic: str = ""
    prompt_text: str = ""
    # Task 1 only: the figures shown in the chart, so accuracy of reporting is checkable.
    chart_description: str | None = None
    essay_text: str
    gold: GoldLabel | None = None
    notes: str | None = None


class GoldenDatasetError(RuntimeError):
    pass


def load_golden_essays(
    golden_dir: Path | None = None,
    *,
    task_filter: str | None = None,
    limit: int | None = None,
) -> list[GoldenEssay]:
    root = Path(golden_dir or DEFAULT_GOLDEN_DIR)
    files = sorted(root.glob("*/*.json")) or sorted(root.glob("*.json"))
    if not files:
        raise GoldenDatasetError(
            f"No golden essays found under {root}. The benchmark cannot run without "
            "labelled ground truth (Constitution Principle IV)."
        )

    essays = []
    for path in files:
        try:
            essays.append(GoldenEssay.model_validate_json(path.read_text(encoding="utf-8")))
        except Exception as exc:
            raise GoldenDatasetError(f"{path} is not a valid golden essay: {exc}") from exc

    # A gold label keyed by a criterion that does not apply to its task type would
    # silently never be compared against anything.
    for essay in essays:
        if essay.gold is None:
            continue
        expected = set(CRITERIA_BY_TASK[essay.task_type])
        unexpected = set(essay.gold.criteria) - expected
        if unexpected:
            raise GoldenDatasetError(
                f"{essay.essay_id} ({essay.task_type}) has gold labels for criteria that "
                f"do not apply to it: {sorted(unexpected)}"
            )

    if task_filter:
        essays = [e for e in essays if e.task_type == task_filter]
    if limit:
        essays = essays[:limit]
    return essays


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, default=str), encoding="utf-8"
    )
