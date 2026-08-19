import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt

from src.utils.config import get_settings

settings = get_settings()


class InvalidAccessTokenError(Exception):
    pass


@dataclass(frozen=True)
class AccessTokenClaims:
    sub: uuid.UUID
    issued_at: datetime
    expires_at: datetime


def create_access_token(account_id: uuid.UUID) -> tuple[str, int]:
    """Returns (token, expires_in_seconds) — research.md decision 3 (≤30 min, stateless)."""
    now = datetime.now(timezone.utc)
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    exp = now + expires_delta
    payload = {
        "sub": str(account_id),
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, int(expires_delta.total_seconds())


def decode_access_token(token: str) -> AccessTokenClaims:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise InvalidAccessTokenError(str(exc)) from exc

    try:
        sub = uuid.UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise InvalidAccessTokenError("malformed subject claim") from exc

    return AccessTokenClaims(
        sub=sub,
        issued_at=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
    )


def generate_refresh_token() -> tuple[str, str]:
    """Returns (raw_token, token_hash). Only the hash is ever persisted (data-model.md)."""
    raw_token = secrets.token_urlsafe(48)
    return raw_token, hash_refresh_token(raw_token)


def hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
