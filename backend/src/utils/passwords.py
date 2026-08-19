from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

_hasher = PasswordHasher()

MIN_PASSWORD_LENGTH = 8


def is_password_strong_enough(password: str) -> bool:
    """FR-001 minimum-strength check (data-model.md: 8+ chars, finalized default)."""
    return len(password) >= MIN_PASSWORD_LENGTH


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
