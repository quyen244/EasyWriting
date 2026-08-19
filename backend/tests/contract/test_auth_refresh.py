def test_refresh_rotates_and_returns_200(client) -> None:
    client.post(
        "/api/v1/auth/signup",
        json={"email": "refresh.success@example.com", "password": "correcthorse123"},
    )
    old_refresh_cookie = client.cookies.get("refresh_token")

    response = client.post("/api/v1/auth/refresh")

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "refresh.success@example.com"
    new_refresh_cookie = client.cookies.get("refresh_token")
    assert new_refresh_cookie is not None
    assert new_refresh_cookie != old_refresh_cookie


def test_refresh_without_cookie_returns_401(client) -> None:
    response = client.post("/api/v1/auth/refresh")

    assert response.status_code == 401
    assert response.json()["error"] == "SESSION_EXPIRED"


def test_refresh_with_garbage_cookie_returns_401(client) -> None:
    client.cookies.set("refresh_token", "not-a-real-token")

    response = client.post("/api/v1/auth/refresh")

    assert response.status_code == 401
