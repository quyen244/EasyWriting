from src.models import Account, RefreshSession


def test_signup_creates_account_with_hashed_password(client, db_session) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "integration.signup@example.com",
            "password": "correcthorse123",
            "display_name": "Integration Learner",
        },
    )
    assert response.status_code == 201

    account = (
        db_session.query(Account)
        .filter(Account.email == "integration.signup@example.com")
        .one()
    )
    assert account.password_hash != "correcthorse123"
    assert account.password_hash.startswith("$argon2")
    assert account.display_name == "Integration Learner"


def test_signup_issues_a_refresh_session_row(client, db_session) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "integration.session@example.com", "password": "correcthorse123"},
    )
    account_id = response.json()["user"]["id"]

    sessions = (
        db_session.query(RefreshSession)
        .filter(RefreshSession.user_id == account_id)
        .all()
    )
    assert len(sessions) == 1
    assert sessions[0].revoked_at is None
    # Only the hash is stored — the raw cookie value must never appear in the DB.
    raw_cookie_value = response.cookies.get("refresh_token")
    assert sessions[0].token_hash != raw_cookie_value


def test_default_display_name_derives_from_email_local_part(client) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "nodisplayname@example.com", "password": "correcthorse123"},
    )

    assert response.json()["user"]["display_name"] == "nodisplayname"
