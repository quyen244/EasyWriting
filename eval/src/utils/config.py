"""Settings for the evaluation workbench.

This package serves no user traffic (Constitution: Technology & Architecture Constraints —
"Local environment"). It exists to run the golden-set benchmark that Principle IV requires
before any scoring-methodology change ships.

Everything database-, auth-, and CORS-related was removed when the self-hosted backend was
retired in constitution v3.0.0: authentication is now Supabase's, and authorization is
enforced by Postgres RLS, so there is nothing here to configure for either.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    environment: str = "development"
    log_level: str = "INFO"

    # --- OpenRouter / LLM (001-ielts-score-assessment) ----------------------
    # Constitution V: the model is a config value behind a model-agnostic interface,
    # never hardcoded. The *active* model/temperature for a benchmark run come from the
    # pipelines/*.yaml config (Constitution IV); these are the fallback defaults.
    openrouter_api_key: str = ""
    openrouter_model: str = "nvidia/nemotron-3-super-120b-a12b:free"
    openrouter_temperature: float = 0.3
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    llm_max_tokens: int = 1536
    llm_timeout_s: int = 180
    llm_max_retries: int = 2
    llm_seed: int | None = 42

    # Minimum word counts per IELTS convention (spec Assumptions, FR-006)
    min_words_task_1: int = 150
    min_words_task_2: int = 250

    # Active pipeline config (Constitution IV) resolved relative to eval/
    pipeline_config: str = "pipelines/v1.yaml"

    def min_words(self, task_type: str) -> int:
        """FR-006 minimum word count for the given task type."""
        return self.min_words_task_1 if task_type == "TASK_1" else self.min_words_task_2


@lru_cache
def get_settings() -> Settings:
    return Settings()
