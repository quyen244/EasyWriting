# Prompt & rubric assets

Versioned scoring assets, loaded at runtime by `src/llm/prompts/loader.py`. Constitution
Principle I names prompts and rubrics as versioned artifacts; this directory is where
they live as **data**, not Python.

## Layout

```
prompts/
└── v1/                              # one directory per prompt version
    ├── criterion_system.txt         # system message for a criterion evaluator
    ├── criterion_user.txt           # user message template
    ├── length_rule_task.txt         # appended for TASK_ACHIEVEMENT / TASK_RESPONSE
    ├── length_rule_other.txt        # appended for the other three criteria
    └── rubrics/
        ├── TASK_ACHIEVEMENT.txt
        ├── TASK_RESPONSE.txt
        ├── COHERENCE_COHESION.txt
        ├── LEXICAL_RESOURCE.txt
        └── GRAMMATICAL_RANGE_ACCURACY.txt
```

Rubric filenames MUST match the criterion enum values in
`src/schemas/assessment.py` — the loader resolves them by name, so a mismatch fails
loudly at load time rather than silently scoring against the wrong descriptors.

## Changing a prompt or the model

Everything is selected from `pipelines/*.yaml`. You do **not** edit Python:

- **Tune wording in place** → edit the `.txt` under the version you are on.
- **Try a new prompt set** → `cp -r prompts/v1 prompts/v2`, edit, then in your pipeline
  YAML set `prompts.version: v2`.
- **Change model / temperature / token budget** → edit the `model:` block in the YAML.

Then run the golden-dataset benchmark and compare before/after (Constitution IV):

```bash
python -m src.evaluation.harness --pipeline-config pipelines/v2.yaml
```

## Template placeholders

`criterion_user.txt` is rendered with `str.format`, so literal braces must be doubled
(`{{` / `}}`). Available placeholders:

| Placeholder | Meaning |
| --- | --- |
| `{criterion_name}` | Human-readable criterion, e.g. `Lexical Resource` |
| `{criterion_code}` | Enum value, e.g. `LEXICAL_RESOURCE` |
| `{rubric}` | Contents of the matching `rubrics/<CODE>.txt` |
| `{prompt_block}` | The exam prompt section, or empty if none was supplied |
| `{essay}` | The learner's essay text |
| `{features}` | Deterministic text statistics (word count, TTR, cohesive devices…) |
| `{length_rule}` | One of the two `length_rule_*.txt` files |

`criterion_system.txt` takes `{task_label}` only.

The loader validates that a version directory contains every required file before use,
so a half-copied `v2/` fails immediately instead of at the first scoring request.
