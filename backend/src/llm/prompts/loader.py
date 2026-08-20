"""Loads versioned prompt + rubric assets from `backend/prompts/<version>/`.

Constitution Principle I names prompts and rubrics as versioned artifacts. Keeping them
as `.txt` files rather than Python constants means changing scoring methodology is a
data edit plus a one-line YAML change — never a code change — which is what makes the
Principle IV before/after benchmark workflow practical:

    cp -r prompts/v1 prompts/v2
    $EDITOR prompts/v2/criterion_user.txt
    $EDITOR pipelines/v2.yaml      # prompts.version: v2
    python -m src.evaluation.harness --pipeline-config pipelines/v2.yaml

Validation is strict and eager: `load_prompt_set` checks every required file exists
before returning. A half-copied `v2/` therefore fails at load time with a list of what
is missing, instead of scoring essays against a silently-absent rubric.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from src.schemas.assessment import CRITERION_NAMES

# backend/ — this file is backend/src/llm/prompts/loader.py
BACKEND_ROOT = Path(__file__).resolve().parents[3]
PROMPTS_ROOT = BACKEND_ROOT / "prompts"

CRITERION_SYSTEM_FILE = "criterion_system.txt"
CRITERION_USER_FILE = "criterion_user.txt"
LENGTH_RULE_TASK_FILE = "length_rule_task.txt"
LENGTH_RULE_OTHER_FILE = "length_rule_other.txt"
RUBRICS_DIR = "rubrics"

REQUIRED_TEMPLATES = (
    CRITERION_SYSTEM_FILE,
    CRITERION_USER_FILE,
    LENGTH_RULE_TASK_FILE,
    LENGTH_RULE_OTHER_FILE,
)


class PromptAssetError(RuntimeError):
    pass


@dataclass(frozen=True)
class PromptSet:
    """Every text asset needed to build a criterion-evaluator call, for one version."""

    version: str
    criterion_system: str
    criterion_user: str
    length_rule_task: str
    length_rule_other: str
    rubrics: dict[str, str]

    def rubric_for(self, criterion: str) -> str:
        try:
            return self.rubrics[criterion]
        except KeyError as exc:
            raise PromptAssetError(
                f"Prompt set {self.version!r} has no rubric for criterion {criterion!r}."
            ) from exc


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def load_prompt_set(version: str, prompts_root: Path | None = None) -> PromptSet:
    root = (prompts_root or PROMPTS_ROOT) / version
    if not root.is_dir():
        available = (
            ", ".join(sorted(p.name for p in (prompts_root or PROMPTS_ROOT).iterdir() if p.is_dir()))
            if (prompts_root or PROMPTS_ROOT).is_dir()
            else "none"
        )
        raise PromptAssetError(
            f"No prompt version {version!r} at {root}. Available versions: {available}."
        )

    missing = [name for name in REQUIRED_TEMPLATES if not (root / name).is_file()]
    rubrics_dir = root / RUBRICS_DIR
    missing += [
        f"{RUBRICS_DIR}/{code}.txt"
        for code in CRITERION_NAMES
        if not (rubrics_dir / f"{code}.txt").is_file()
    ]
    if missing:
        raise PromptAssetError(
            f"Prompt version {version!r} at {root} is incomplete. Missing: "
            + ", ".join(missing)
        )

    return PromptSet(
        version=version,
        criterion_system=_read(root / CRITERION_SYSTEM_FILE),
        criterion_user=_read(root / CRITERION_USER_FILE),
        length_rule_task=_read(root / LENGTH_RULE_TASK_FILE),
        length_rule_other=_read(root / LENGTH_RULE_OTHER_FILE),
        rubrics={code: _read(rubrics_dir / f"{code}.txt") for code in CRITERION_NAMES},
    )


@lru_cache
def get_prompt_set(version: str) -> PromptSet:
    """Cached accessor — prompt assets are immutable for the lifetime of a process."""
    return load_prompt_set(version)
