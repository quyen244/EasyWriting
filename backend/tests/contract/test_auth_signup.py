def test_signup_success_returns_201_with_auth_response(client) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "new.learner@example.com", "password": "correcthorse123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]
    assert body["expires_in"] > 0
    assert body["user"]["email"] == "new.learner@example.com"
    assert "id" in body["user"]
    assert "display_name" in body["user"]
    assert "refresh_token" in response.cookies


def test_signup_duplicate_email_returns_409(client) -> None:
    payload = {"email": "duplicate@example.com", "password": "correcthorse123"}
    first = client.post("/api/v1/auth/signup", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/signup", json=payload)

    assert second.status_code == 409
    body = second.json()
    assert body["error"] == "EMAIL_ALREADY_REGISTERED"


def test_signup_duplicate_email_is_case_insensitive(client) -> None:
    client.post(
        "/api/v1/auth/signup",
        json={"email": "CaseTest@Example.com", "password": "correcthorse123"},
    )

    second = client.post(
        "/api/v1/auth/signup",
        json={"email": "casetest@example.com", "password": "correcthorse123"},
    )

    assert second.status_code == 409


def test_signup_weak_password_returns_400(client) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "weak.password@example.com", "password": "short"},
    )

    assert response.status_code == 400
    body = response.json()
    assert body["error"] == "WEAK_PASSWORD"


def test_signup_missing_fields_returns_422(client) -> None:
    response = client.post("/api/v1/auth/signup", json={"email": "no.password@example.com"})

    assert response.status_code == 422
