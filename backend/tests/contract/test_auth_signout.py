def test_signout_returns_204(authed_client_factory) -> None:
    client, access_token, _ = authed_client_factory("signout.success@example.com")

    response = client.post(
        "/api/v1/auth/signout", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 204


def test_refresh_after_signout_fails_with_same_cookie(authed_client_factory) -> None:
    client, access_token, _ = authed_client_factory("signout.refresh@example.com")

    client.post("/api/v1/auth/signout", headers={"Authorization": f"Bearer {access_token}"})
    response = client.post("/api/v1/auth/refresh")

    assert response.status_code == 401
    assert response.json()["error"] == "SESSION_EXPIRED"


def test_signout_requires_authentication(client) -> None:
    response = client.post("/api/v1/auth/signout")

    assert response.status_code == 401
