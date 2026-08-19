import logging
import sys

from src.utils.config import get_settings

_SENSITIVE_KEYS = {"password", "password_hash", "access_token", "refresh_token", "token_hash"}


def configure_logging() -> None:
    """Structured logging (Constitution VII). Auth events (src/routes/auth.py) log only
    non-sensitive fields — never credentials or token values (Constitution VII, T034/T037)."""
    settings = get_settings()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}'
        )
    )
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.log_level)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def redact(fields: dict) -> dict:
    """Defense-in-depth: strip anything sensitive before it ever reaches a log call."""
    return {k: ("<redacted>" if k in _SENSITIVE_KEYS else v) for k, v in fields.items()}
