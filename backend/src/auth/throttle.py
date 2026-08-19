from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.auth.errors import TooManyAttemptsError
from src.auth.validation import normalize_email
from src.models import FailedSignInAttempt
from src.utils.config import get_settings

settings = get_settings()


def ensure_not_throttled(db: Session, email: str, ip_address: str) -> None:
    """research.md decision 6: reject BEFORE checking the password once either the email
    or the IP has too many recent failures — a simple Postgres-backed counter, no Redis."""
    window_start = datetime.now(timezone.utc) - timedelta(
        minutes=settings.failed_signin_window_minutes
    )
    normalized_email = normalize_email(email)

    count = (
        db.query(FailedSignInAttempt)
        .filter(
            FailedSignInAttempt.attempted_at >= window_start,
            (FailedSignInAttempt.email == normalized_email)
            | (FailedSignInAttempt.ip_address == ip_address),
        )
        .count()
    )
    if count >= settings.failed_signin_max_attempts:
        raise TooManyAttemptsError()


def record_failed_attempt(db: Session, email: str, ip_address: str) -> None:
    db.add(FailedSignInAttempt(email=normalize_email(email), ip_address=ip_address))
    db.flush()
