def test_me_returns_200_when_authenticated(authed_client_factory) -> None:
    client, access_token, user = authed_client_factory("me.success@example.com")

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == user["id"]
    assert body["email"] == "me.success@example.com"
    assert "display_name" in body


def test_me_returns_401_without_credentials(client) -> None:
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["error"] == "SESSION_EXPIRED"


def test_me_returns_401_with_malformed_token(client) -> None:
    response = client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"}
    )

    assert response.status_code == 401
    assert response.json()["error"] == "SESSION_EXPIRED"


def test_me_never_exposes_password_hash(authed_client_factory) -> None:
    client, access_token, _ = authed_client_factory("me.no-hash@example.com")

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})

    assert "password_hash" not in response.json()
    assert "password" not in response.json()
