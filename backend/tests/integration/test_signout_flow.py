from src.models import RefreshSession


def test_signout_revokes_session_immediately(client, db_session, authed_client_factory) -> None:
    client, access_token, user = authed_client_factory("signout.immediate@example.com")

    signout_response = client.post(
        "/api/v1/auth/signout", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert signout_response.status_code == 204

    session = (
        db_session.query(RefreshSession)
        .filter(RefreshSession.user_id == user["id"])
        .one()
    )
    assert session.revoked_at is not None

    # spec SC-004: 0% of requests using a signed-out session succeed.
    refresh_after_signout = client.post("/api/v1/auth/refresh")
    assert refresh_after_signout.status_code == 401
