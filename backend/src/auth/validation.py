from sqlalchemy.orm import Session

from src.auth.errors import EmailAlreadyRegisteredError, WeakPasswordError
from src.models import Account
from src.utils.passwords import is_password_strong_enough


def normalize_email(email: str) -> str:
    """Case-insensitive uniqueness (data-model.md) — store/compare lowercase."""
    return email.strip().lower()


def ensure_signup_is_valid(db: Session, email: str, password: str) -> None:
    """FR-001/FR-002: unique email + minimum password strength, checked in that order
    so a weak password on an already-registered email still reports EMAIL_ALREADY_REGISTERED
    first (matches the account-existence check being the more specific gate)."""
    existing = db.query(Account).filter(Account.email == normalize_email(email)).first()
    if existing is not None:
        raise EmailAlreadyRegisteredError()

    if not is_password_strong_enough(password):
        raise WeakPasswordError()
