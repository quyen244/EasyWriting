# 003-account-authentication — RETIRED

**Status**: Retired 2026-08-21. Superseded by Supabase Auth (constitution v3.0.0).

**Retired**: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`,
`contracts/auth-openapi.yaml`, `checklists/requirements.md`. Recoverable from git history.

This project no longer builds an authentication service. Supabase Auth provides sign-up,
sign-in, session management, and password hashing; authorization is enforced by Postgres RLS
(constitution Principle VII). The implementation this spec designed — JWT issuance, refresh-token
rotation and reuse detection, an argon2 password hasher, a failed-sign-in throttle table, and the
`/api/v1/auth/*` HTTP contract — was deleted along with the backend.

**What auth must do did not change. Only who implements it changed.** This file exists so those
requirements are carried forward rather than re-derived from memory when the Supabase platform
spec is written.

## Requirements that carry forward

| # | Requirement | Under Supabase |
|---|---|---|
| FR-001 | Create an account with a unique email and a password | Native |
| FR-002 | Reject sign-up for an already-registered email, without confirming that the email exists to an unauthenticated caller | Native — verify the default response does not leak existence |
| FR-003 | Verify email/password on sign-in; reject invalid attempts | Native |
| FR-004 | Keep a learner recognized as signed in across page navigation and reloads | Native — `supabase-js` persists and refreshes the session |
| FR-005 | Reject any request to a protected capability lacking a valid, unexpired session | **Now an RLS concern, not an endpoint concern.** Every table holding learner data needs policies scoped to `auth.uid()`. This is the requirement most changed in character by the migration. |
| FR-006 | Sign out, after which that session can no longer reach protected capabilities | Native |
| FR-007 | Store only the account data needed to authenticate and display a profile; never a plaintext password | Native. The `profiles` table must not accumulate fields beyond this. |
| FR-008 | Email + password only for the MVP; social/OAuth may be added later without disturbing other requirements | Native, and Supabase makes adding OAuth later cheap |
| FR-009 | Self-service password reset is out of scope for the MVP | **Revisit — see below** |
| FR-010 | Sessions stay usable for a bounded but comfortably long period; short sessions refresh silently, the whole session expires after extended inactivity | Native — configurable in the Supabase dashboard, so it must be recorded as a migration/config artifact, not left at whatever the default happens to be |

## Success criteria that carry forward

- **SC-001**: A new visitor can create an account and reach the workspace in under 1 minute.
- **SC-002**: 100% of requests to protected capabilities without a valid session are rejected.
  Now demonstrated by RLS policy tests (Principle III), not by endpoint tests.
- **SC-003**: A signed-in learner is not asked to re-enter credentials more than once per session
  during normal use.
- **SC-004**: Sign-out takes effect immediately — 0% of requests using a signed-out session succeed.
- **SC-005**: Failed sign-in never reveals whether the email or the password was the wrong part.

## Decisions worth re-opening

**FR-009 (no password reset).** This was excluded from the MVP because building a secure reset
flow — token generation, expiry, single use, email delivery — was expensive relative to its value
at launch. Supabase provides the whole flow natively. The reason for the exclusion no longer
exists, so carrying it forward unexamined would lock in an arbitrary limitation. Decide
deliberately in the platform spec.

**Throttling.** The failed-sign-in throttle (a 15-minute window, 5 attempts) was this project's
own table and logic; both are gone. Confirm what Supabase Auth enforces by default before
assuming the protection carried over. Note this is separate from the per-user rate limit
Principle V requires on paid scoring calls — that one is still ours to build.

**Session lifetime.** FR-010 deliberately left the exact duration to be finalized during
planning, and planning never fixed it. It is now a Supabase setting with a vendor default.
Choose a value and record it.
