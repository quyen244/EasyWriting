# Phase 1 Data Model: Account Authentication

## Account (`users` table — extends `001-ielts-score-assessment`'s stub)

This is the same `Account`/`users` table `001` and `002` reference by foreign key (the
SQLAlchemy model is named `Account`, not `Learner` — `/speckit-analyze` finding I2 canonicalized
the name across all three specs); this feature owns its authentication-relevant columns.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | already defined by `001` |
| email | text, unique (case-insensitive) | required — FR-001, FR-002 |
| password_hash | text | Argon2id hash string (research.md decision 2); never plaintext (FR-007) |
| display_name | text | shown on the profile page (`002`) |
| created_at | timestamptz | already defined by `001` |
| updated_at | timestamptz | NEW |

**Validation rules**:
- `email` MUST be a syntactically valid address and unique case-insensitively; a duplicate
  signup attempt fails with `EMAIL_ALREADY_REGISTERED` without revealing further account details
  (FR-002).
- `password_hash` is derived from a plaintext password that MUST be at least 8 characters at
  signup (reasonable minimum-strength default for FR-001, finalized here since the spec left the
  exact threshold to planning).

## RefreshSession (`refresh_sessions` table — the spec's "Session" entity)

Represents one refresh-token lineage for an account (research.md decisions 3 and 5).

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | |
| token_hash | text, unique | SHA-256 hash of the raw refresh token — the raw value is never stored |
| issued_at | timestamptz | |
| expires_at | timestamptz | `issued_at` + 7 days (pinned default, research.md decision 3) — absolute expiry bounding total inactivity window (FR-010) |
| revoked_at | timestamptz, nullable | set on sign-out, rotation, or reuse-detection |
| replaced_by_id | UUID, nullable (FK → refresh_sessions.id) | links a rotated token to its successor |
| created_ip / created_user_agent | text, nullable | optional context for a future security review (Constitution VII) |

**Validation rules**:
- A refresh session is usable only if `revoked_at IS NULL AND expires_at > now()`.
- Refreshing MUST be atomic: revoke the presented row (`revoked_at = now()`, `replaced_by_id =
  <new row id>`) and insert the new row in the same transaction.
- Presenting a token whose `token_hash` matches a row where `revoked_at IS NOT NULL` MUST revoke
  every non-revoked `RefreshSession` for that `user_id` (reuse detection, decision 5).

## AccessToken (JWT — not a persisted entity)

Not stored anywhere; documented here for completeness since it is part of "what the system
issues," even though it is not "what the system stores."

| Claim | Meaning |
|---|---|
| `sub` | `users.id` |
| `iat` | issued-at timestamp |
| `exp` | `iat` + access-token lifetime (≤30 minutes, research.md decision 3) |

## FailedSignInAttempt (`failed_signin_attempts` table)

Supports research.md decision 6 (throttling); not a spec-named entity, but required to satisfy
the spec's brute-force edge case under Constitution Principle VII.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| email | text | the attempted email, regardless of whether it exists |
| ip_address | text | |
| attempted_at | timestamptz | |

**Validation rules**: Sign-in MUST be rejected with a generic throttling message once the count of
rows for the same `email` or `ip_address` within a short rolling window exceeds a configured
threshold, independent of whether the credentials would otherwise have been valid.

## State Transitions

`RefreshSession`:

```
issued ──used for /refresh──▶ revoked (replaced_by_id set) ──(new row)──▶ issued
       ──sign-out───────────▶ revoked (replaced_by_id null)
       ──expires_at passes──▶ (passively invalid, no state change needed)
       ──revoked token reused──▶ ALL of the user's non-revoked sessions → revoked
```

`Account` has no status field — the mere existence of a `users` row with a matching, verified
`password_hash` is sufficient; account deactivation is out of scope for this feature.
