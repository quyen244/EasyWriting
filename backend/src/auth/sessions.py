import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from src.auth.errors import SessionExpiredError
from src.auth.tokens import generate_refresh_token, hash_refresh_token, refresh_token_expiry
from src.models import RefreshSession


def issue_refresh_session(
    db: Session,
    account_id: uuid.UUID,
    *,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[RefreshSession, str]:
    """Creates a new RefreshSession row. Returns (row, raw_token) — only the row's
    token_hash is persisted; the raw token is what the caller sets as the cookie."""
    raw_token, token_hash = generate_refresh_token()
    session = RefreshSession(
        user_id=account_id,
        token_hash=token_hash,
        expires_at=refresh_token_expiry(),
        created_ip=ip_address,
        created_user_agent=user_agent,
    )
    db.add(session)
    db.flush()
    return session, raw_token


def _revoke_all_sessions_for_account(db: Session, account_id: uuid.UUID) -> None:
    now = datetime.now(timezone.utc)
    db.query(RefreshSession).filter(
        RefreshSession.user_id == account_id, RefreshSession.revoked_at.is_(None)
    ).update({"revoked_at": now}, synchronize_session=False)


def rotate_refresh_session(
    db: Session,
    raw_token: str,
    *,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[RefreshSession, str]:
    """Atomically verifies, revokes, and replaces a refresh token (research.md decision 5).

    Raises SessionExpiredError if the token is unknown/expired, or — critically — if it
    matches an *already-revoked* row, in which case every non-revoked session for that
    account is revoked immediately (reuse detection: a revoked token being presented again
    is a strong signal of a stolen, replayed copy).
    """
    token_hash = hash_refresh_token(raw_token)
    presented = db.query(RefreshSession).filter(RefreshSession.token_hash == token_hash).first()

    if presented is None:
        raise SessionExpiredError()

    if presented.revoked_at is not None:
        _revoke_all_sessions_for_account(db, presented.user_id)
        db.flush()
        raise SessionExpiredError(
            "This session was already used and has been revoked; all sessions for this "
            "account were signed out as a precaution. Please sign in again."
        )

    now = datetime.now(timezone.utc)
    expires_at = presented.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        raise SessionExpiredError()

    new_session, new_raw_token = issue_refresh_session(
        db, presented.user_id, ip_address=ip_address, user_agent=user_agent
    )
    presented.revoked_at = now
    presented.replaced_by_id = new_session.id
    db.flush()

    return new_session, new_raw_token


def revoke_session_by_raw_token(db: Session, raw_token: str) -> bool:
    """FR-006: sign-out. Returns True if a live session was found and revoked."""
    token_hash = hash_refresh_token(raw_token)
    session = (
        db.query(RefreshSession)
        .filter(RefreshSession.token_hash == token_hash, RefreshSession.revoked_at.is_(None))
        .first()
    )
    if session is None:
        return False
    session.revoked_at = datetime.now(timezone.utc)
    db.flush()
    return True
