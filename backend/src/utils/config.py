from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    environment: str = "development"
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5433/writewise"

    # --- OpenRouter / LLM (001-ielts-score-assessment) ----------------------
    # Constitution V: the model is a config value behind a model-agnostic interface,
    # never hardcoded. The *active* model/temperature for a scoring run come from the
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

    # Active pipeline config (Constitution IV) resolved relative to backend/
    pipeline_config: str = "pipelines/v1.yaml"

    # JWT / auth (003-account-authentication)
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7  # research.md decision 3 (003) — pinned default

    # Failed sign-in throttling (research.md decision 6, 003)
    failed_signin_window_minutes: int = 15
    failed_signin_max_attempts: int = 5

    # CORS — frontend runs on a different origin (Vercel) than this backend (rexsantech.com)
    cors_allow_origins: list[str] = ["http://localhost:3000"]


    def min_words(self, task_type: str) -> int:
        """FR-006 minimum word count for the given task type."""
        return self.min_words_task_1 if task_type == "TASK_1" else self.min_words_task_2


@lru_cache
def get_settings() -> Settings:
    return Settings()
