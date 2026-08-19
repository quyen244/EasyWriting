from src.models import RefreshSession


def test_reusing_a_rotated_refresh_token_revokes_all_sessions(client, db_session) -> None:
    email = "reuse.detection@example.com"
    signup_response = client.post(
        "/api/v1/auth/signup", json={"email": email, "password": "correcthorse123"}
    )
    account_id = signup_response.json()["user"]["id"]
    old_refresh_token = client.cookies.get("refresh_token")

    rotate_response = client.post("/api/v1/auth/refresh")
    assert rotate_response.status_code == 200
    new_refresh_token = client.cookies.get("refresh_token")
    assert new_refresh_token != old_refresh_token

    # Present the now-revoked OLD token again — this is the reuse/replay scenario.
    client.cookies.set("refresh_token", old_refresh_token)
    reuse_response = client.post("/api/v1/auth/refresh")
    assert reuse_response.status_code == 401
    assert reuse_response.json()["error"] == "SESSION_EXPIRED"

    # The rotated (previously valid) token must ALSO now be revoked as a precaution.
    client.cookies.set("refresh_token", new_refresh_token)
    followup_response = client.post("/api/v1/auth/refresh")
    assert followup_response.status_code == 401

    all_sessions = (
        db_session.query(RefreshSession).filter(RefreshSession.user_id == account_id).all()
    )
    assert len(all_sessions) == 2  # original + one rotation
    assert all(session.revoked_at is not None for session in all_sessions)
