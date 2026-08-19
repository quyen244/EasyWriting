# Phase 0 Research: Account Authentication

## 1. JWT library

**Decision**: `PyJWT` for encoding/verifying access tokens.

**Rationale**: Actively maintained, minimal API surface, and this feature only needs signed JWTs
(HS256 to start, since the backend is a single service — no need for asymmetric keys yet).

**Alternatives considered**: `python-jose` — supports the fuller JOSE suite (JWE encryption, more
algorithms) that nothing here requires; extra surface area for no current benefit (Constitution VI).

## 2. Password hashing

**Decision**: Argon2id via `argon2-cffi`.

**Rationale**: Argon2id is the current OWASP-recommended default — memory-hard, resistant to
GPU/ASIC cracking, and has sane defaults built into the library (no manual cost-factor tuning
required to get a reasonable starting point).

**Alternatives considered**: `bcrypt` (via `passlib`) — still cryptographically acceptable, but
`passlib` itself is effectively unmaintained, and Argon2id is the stronger current default at
comparable implementation cost.

## 3. Token architecture: stateless access token + DB-backed refresh session

**Decision**: Short-lived JWT access token (≤30 min, not checked against the DB per request) paired
with an opaque, DB-backed, hashed refresh token in a `refresh_sessions` table, with an absolute
`expires_at` of **7 days** from issuance (pinned default for FR-010, resolving the `/speckit-analyze`
finding U1 gap — spec FR-010 left the exact number to planning and no prior artifact had pinned
one).

**Rationale**: Spec FR-010 asks for a "comfortably long" session via silent refresh, while SC-004
requires sign-out to take effect immediately. A pure stateless JWT can satisfy the first but not
the second (you cannot revoke a JWT you don't track). Splitting the two — a fast, unchecked
short-lived token for routine requests, and a real DB row for the thing that actually needs to be
revocable — satisfies both without checking the DB on every single request. 7 days sits squarely
in FR-010's "days to weeks" band: long enough that an active learner is never forced to re-sign-in
mid-use, short enough to bound a stolen-but-unused refresh token's exposure window without needing
a longer-lived renewal mechanism.

**Alternatives considered**: One long-lived JWT with a server-side revocation blocklist — this
reinvents a session store anyway, but as an ever-growing blocklist instead of a clean per-session
row with a natural expiry; rejected as more complex for no benefit. 30 days — considered as a
"comfortably long" upper bound, but rejected as an unnecessarily wide exposure window for a
first-pass default; can be revisited if real usage shows 7 days causes noticeable re-sign-in
friction.

## 4. Token transport

**Decision**: Access token returned in the JSON response body (held in frontend memory/state,
sent as `Authorization: Bearer <token>`). Refresh token set as an `httpOnly`, `Secure`,
`SameSite=None` cookie scoped to the backend's domain.

**Rationale**: Frontend (Vercel) and backend (`rexsantech.com` via cloudflared) are different
origins, so the refresh call is cross-site — `SameSite=None; Secure` is required for the cookie to
be sent at all. Keeping the refresh token `httpOnly` (unreadable to JS) while the access token
lives only briefly in memory limits what an XSS payload could steal to a short-lived token.

**Alternatives considered**: Both tokens in `localStorage` — rejected, exposes the longer-lived
refresh token to any XSS on the frontend. `SameSite=Lax` cookie — rejected, would silently break
the cross-origin refresh call from the Vercel-hosted frontend.

## 5. Refresh rotation & reuse detection

**Decision**: Every successful `/refresh` call issues a new refresh token and revokes the one
that was presented. If a *revoked* refresh token is presented again, all sessions for that
account are revoked immediately.

**Rationale**: A previously-revoked token being reused is a strong signal that a stolen copy of
that token is being replayed by someone else; revoking the whole account's sessions is a cheap,
high-value defense given Constitution Principle VII's "security by default" — the alternative
(no rotation) is materially weaker for almost no extra implementation cost.

**Alternatives considered**: No rotation, reuse the same refresh token until its own expiry —
rejected as the weaker default for a feature whose whole job is security.

## 6. Failed sign-in throttling

**Decision**: A simple failed-attempt counter per email and per IP, stored in Postgres, with a
short lockout/backoff window after repeated failures (addresses the spec's brute-force edge case).

**Rationale**: Handles the spec's named brute-force/credential-stuffing edge case without adding
new infrastructure (e.g. Redis) at this scale — one indexed table is enough for a single-instance
backend behind one Cloudflare Tunnel.

**Alternatives considered**: Redis-backed rate limiting — deferred as infrastructure the project
doesn't need yet (Constitution VI); revisit only if the simple counter proves insufficient under
real load.

## 7. Boundary with 001 and 002

**Decision**: This feature implements the real logic behind `backend/src/api/deps.py`'s
bearer-auth dependency (which `001` left as a stub) and ships a small frontend auth client/hook
(`frontend/src/lib/auth.ts`, `frontend/src/hooks/useAuth.ts`) for `002`'s pages to call. It does
not build the sign-up/sign-in page UI or the workspace/profile pages themselves.

**Rationale**: Keeps a clean seam — `003` owns the authentication *capability*, `002` owns the
*pages* that use it, matching how the specs already described their own boundaries in each
other's Assumptions sections.

**Alternatives considered**: Build the sign-up/sign-in forms here too — rejected, would duplicate
scope already claimed by `002-core-app-ux`.
