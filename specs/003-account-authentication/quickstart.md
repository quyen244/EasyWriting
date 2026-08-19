# Quickstart: Account Authentication

Validates this feature end-to-end per [spec.md](./spec.md), against
[contracts/auth-openapi.yaml](./contracts/auth-openapi.yaml) and
[data-model.md](./data-model.md).

## Prerequisites

- The same PostgreSQL + backend containers used by `001-ielts-score-assessment`
  (`docker compose up -d`), with this feature's migration applied (`alembic upgrade head`)
- A cookie-aware HTTP client (e.g. `curl -c cookies.txt -b cookies.txt ...` or a browser) since
  the refresh token travels as an httpOnly cookie

## Validation Scenario 1 — Create an account (User Story 1)

```bash
curl -c cookies.txt -X POST https://rexsantech.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "learner@example.com", "password": "correcthorse123", "display_name": "Learner"}'
```

**Expected**: HTTP 201 with an `access_token` and `user` object; `cookies.txt` now contains a
`Secure; HttpOnly` refresh-token cookie. Repeating the same request returns HTTP 409
`EMAIL_ALREADY_REGISTERED`.

## Validation Scenario 2 — Sign in and access a protected resource (User Story 2)

```bash
curl -X POST https://rexsantech.com/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "learner@example.com", "password": "correcthorse123"}'
# then, using the returned access_token:
curl https://rexsantech.com/api/v1/auth/me -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected**: `/me` returns HTTP 200 with the account's `id`, `email`, `display_name`. An
incorrect password returns HTTP 401 with a generic `INVALID_CREDENTIALS` message that does not
say which field was wrong.

## Validation Scenario 3 — Silent refresh (User Story 2, FR-010)

```bash
curl -c cookies.txt -b cookies.txt -X POST https://rexsantech.com/api/v1/auth/refresh
```

**Expected**: HTTP 200 with a new `access_token`; `cookies.txt`'s refresh cookie is rotated
(data-model.md state transitions). Reusing the *previous* refresh cookie afterward returns HTTP
401 and revokes all of the account's sessions (reuse detection — verify a subsequent `/me` call
with the old access token also eventually fails once it expires).

## Validation Scenario 4 — Sign out (User Story 3)

```bash
curl -b cookies.txt -X POST https://rexsantech.com/api/v1/auth/signout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
curl -b cookies.txt -X POST https://rexsantech.com/api/v1/auth/refresh
```

**Expected**: signout returns HTTP 204. The subsequent `/refresh` call with the now-revoked
cookie returns HTTP 401 — sign-out took effect immediately (spec SC-004).

## Validation Scenario 5 — Failed sign-in throttling (Edge Case, research.md decision 6)

Submit 10+ rapid incorrect-password sign-in attempts for the same email.

**Expected**: Attempts beyond the configured threshold return HTTP 429 `TOO_MANY_ATTEMPTS`
instead of HTTP 401, even before checking the password.
