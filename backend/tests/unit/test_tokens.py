import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from src.utils.config import get_settings
from src.auth.tokens import (
    InvalidAccessTokenError,
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_refresh_token,
)


def test_create_and_decode_valid_token() -> None:
    account_id = uuid.uuid4()
    token, expires_in = create_access_token(account_id)

    claims = decode_access_token(token)

    assert claims.sub == account_id
    assert expires_in == get_settings().access_token_expire_minutes * 60


def test_decode_rejects_expired_token() -> None:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expired_payload = {
        "sub": str(uuid.uuid4()),
        "iat": int((now - timedelta(hours=1)).timestamp()),
        "exp": int((now - timedelta(minutes=1)).timestamp()),
    }
    expired_token = jwt.encode(
        expired_payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )

    with pytest.raises(InvalidAccessTokenError):
        decode_access_token(expired_token)


def test_decode_rejects_tampered_token() -> None:
    account_id = uuid.uuid4()
    token, _ = create_access_token(account_id)
    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")

    with pytest.raises(InvalidAccessTokenError):
        decode_access_token(tampered)


def test_decode_rejects_wrong_signing_key() -> None:
    payload = {
        "sub": str(uuid.uuid4()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
    }
    token = jwt.encode(payload, "a-completely-different-secret-value-32b+", algorithm="HS256")

    with pytest.raises(InvalidAccessTokenError):
        decode_access_token(token)


def test_generate_refresh_token_returns_distinct_raw_and_hash() -> None:
    raw_token, token_hash = generate_refresh_token()

    assert raw_token != token_hash
    assert hash_refresh_token(raw_token) == token_hash


def test_refresh_tokens_are_unique() -> None:
    raw_a, _ = generate_refresh_token()
    raw_b, _ = generate_refresh_token()

    assert raw_a != raw_b
