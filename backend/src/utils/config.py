from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    environment: str = "development"
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5433/writewise"

    # OpenRouter (consumed by 001-ielts-score-assessment; declared here since Settings is shared)
    openrouter_api_key: str = ""

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


@lru_cache
def get_settings() -> Settings:
    return Settings()
