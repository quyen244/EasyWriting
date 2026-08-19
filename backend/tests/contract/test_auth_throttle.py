from src.utils.config import get_settings


def test_signin_throttles_after_max_failed_attempts(client) -> None:
    max_attempts = get_settings().failed_signin_max_attempts
    email = "throttle.contract@example.com"
    client.post("/api/v1/auth/signup", json={"email": email, "password": "correcthorse123"})

    statuses = []
    for _ in range(max_attempts + 1):
        response = client.post(
            "/api/v1/auth/signin", json={"email": email, "password": "wrongpassword"}
        )
        statuses.append(response.status_code)

    assert statuses[:max_attempts] == [401] * max_attempts
    assert statuses[max_attempts] == 429
    assert response.json()["error"] == "TOO_MANY_ATTEMPTS"


def test_throttle_response_does_not_check_password_once_limited(client) -> None:
    """Even a *correct* password must be rejected with 429 once throttled — the check
    happens before credential verification (research.md decision 6)."""
    max_attempts = get_settings().failed_signin_max_attempts
    email = "throttle.correctpass@example.com"
    password = "correcthorse123"
    client.post("/api/v1/auth/signup", json={"email": email, "password": password})

    for _ in range(max_attempts):
        client.post("/api/v1/auth/signin", json={"email": email, "password": "wrongpassword"})

    response = client.post("/api/v1/auth/signin", json={"email": email, "password": password})

    assert response.status_code == 429
