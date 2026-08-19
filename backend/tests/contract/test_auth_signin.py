def test_signin_success_returns_200_with_auth_response(client) -> None:
    client.post(
        "/api/v1/auth/signup",
        json={"email": "signin.success@example.com", "password": "correcthorse123"},
    )

    response = client.post(
        "/api/v1/auth/signin",
        json={"email": "signin.success@example.com", "password": "correcthorse123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "signin.success@example.com"
    assert "refresh_token" in response.cookies


def test_signin_wrong_password_returns_generic_401(client) -> None:
    client.post(
        "/api/v1/auth/signup",
        json={"email": "signin.wrongpass@example.com", "password": "correcthorse123"},
    )

    response = client.post(
        "/api/v1/auth/signin",
        json={"email": "signin.wrongpass@example.com", "password": "totallywrong"},
    )

    assert response.status_code == 401
    body = response.json()
    assert body["error"] == "INVALID_CREDENTIALS"
    assert "password" not in body["message"].lower().replace("password.", "")


def test_signin_unknown_email_returns_same_generic_401(client) -> None:
    response = client.post(
        "/api/v1/auth/signin",
        json={"email": "never.registered@example.com", "password": "correcthorse123"},
    )

    assert response.status_code == 401
    assert response.json()["error"] == "INVALID_CREDENTIALS"


def test_signin_unknown_and_wrong_password_return_identical_error_body(client) -> None:
    """FR-003: must not reveal which part (email vs password) was wrong."""
    client.post(
        "/api/v1/auth/signup",
        json={"email": "identical.error@example.com", "password": "correcthorse123"},
    )

    wrong_password = client.post(
        "/api/v1/auth/signin",
        json={"email": "identical.error@example.com", "password": "nope"},
    )
    unknown_email = client.post(
        "/api/v1/auth/signin",
        json={"email": "does.not.exist@example.com", "password": "nope"},
    )

    assert wrong_password.json() == unknown_email.json()
    assert wrong_password.status_code == unknown_email.status_code == 401
