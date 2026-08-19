def test_signin_then_me_then_refresh_then_new_token_works(client) -> None:
    email = "flow.full@example.com"
    password = "correcthorse123"
    client.post("/api/v1/auth/signup", json={"email": email, "password": password})
    client.cookies.clear()  # simulate a brand-new browser session for the signin step

    signin_response = client.post(
        "/api/v1/auth/signin", json={"email": email, "password": password}
    )
    assert signin_response.status_code == 200
    access_token = signin_response.json()["access_token"]

    me_response = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email

    refresh_response = client.post("/api/v1/auth/refresh")
    assert refresh_response.status_code == 200
    new_access_token = refresh_response.json()["access_token"]
    # Access tokens are pure functions of (sub, iat, exp) — two issued within the same
    # second are legitimately identical (stateless JWT, no per-token nonce). What refresh
    # actually guarantees is a *usable* new token and a rotated refresh cookie (asserted
    # elsewhere, e.g. test_refresh_reuse_detection.py), not token-string novelty.

    me_with_new_token = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {new_access_token}"}
    )
    assert me_with_new_token.status_code == 200
    assert me_with_new_token.json()["email"] == email
