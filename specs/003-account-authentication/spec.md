# Feature Specification: Account Authentication

**Feature Branch**: `003-account-authentication`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Backend authentication (JWT) and database — data modeling for what
account/session information the system should store — as the prerequisite auth mechanism for
signing in/out of the workspace and profile pages, and for gating essay submission."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an account (Priority: P1)

A new visitor creates an account so they can access the workspace and submit essays for scoring.

**Why this priority**: Nothing else in the product (scoring, workspace, profile) is reachable
without an account. This is the entry point every other feature depends on.

**Independent Test**: Submit a new email and password through account creation and verify a new,
signed-in account exists afterward.

**Acceptance Scenarios**:

1. **Given** an email not already registered, **When** a visitor completes account creation with
   that email and a valid password, **Then** an account is created and they are signed in.
2. **Given** an email that is already registered, **When** a visitor tries to create an account
   with it again, **Then** they are told the email is already in use, without exposing whether
   a specific password was correct or not.
3. **Given** a password that does not meet the minimum requirements, **When** a visitor submits
   it, **Then** account creation is rejected with a clear reason.

---

### User Story 2 - Sign in and stay signed in (Priority: P1)

A learner with an existing account signs in with their credentials and remains recognized as
signed in as they use the product, without re-entering credentials on every page or request.

**Why this priority**: Equally foundational to account creation — a learner who can't reliably
stay signed in can't use the workspace.

**Independent Test**: Sign in with valid credentials, then access a protected page (workspace)
without being asked to sign in again.

**Acceptance Scenarios**:

1. **Given** a registered learner, **When** they submit their correct email and password, **Then**
   they are signed in and can reach the workspace and profile pages.
2. **Given** a registered learner, **When** they submit an incorrect password, **Then** sign-in is
   rejected with a generic "incorrect email or password" message that does not reveal which part
   was wrong.
3. **Given** a signed-in learner, **When** they navigate between pages or reload the app within
   their session, **Then** they remain signed in without re-entering credentials.
4. **Given** a learner's session has expired, **When** they try to submit an essay or open the
   workspace, **Then** they are asked to sign in again rather than seeing a silent failure.

---

### User Story 3 - Sign out (Priority: P2)

A signed-in learner signs out, ending their ability to use the account on that device/browser
until they sign in again.

**Why this priority**: Important for shared/public-device safety and account hygiene, but the
product delivers its core value even before this exists (a learner could simply close the tab).

**Independent Test**: Sign in, sign out, then verify the workspace and profile pages are no
longer reachable without signing in again.

**Acceptance Scenarios**:

1. **Given** a signed-in learner, **When** they sign out, **Then** their current session can no
   longer be used to submit essays or view the profile page.
2. **Given** a learner who signed out, **When** they try to reuse a link or button that previously
   worked while signed in, **Then** they are redirected to sign in rather than granted access.

---

### Edge Cases

- What happens if a learner tries to sign in with an email that was never registered?
- What happens if account creation and sign-in are attempted repeatedly and rapidly (credential
  stuffing / brute-force attempts)?
- What happens to an in-progress essay submission if the learner's session expires mid-request?
- What happens if a learner signs in from a second device while already signed in on a first —
  are both sessions valid, or does one invalidate the other?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a visitor create an account with a unique email address and a
  password meeting a stated minimum strength.
- **FR-002**: System MUST reject account creation for an email that is already registered,
  without revealing any other account details.
- **FR-003**: System MUST verify an email/password pair on sign-in and reject invalid attempts
  with a generic error that does not indicate whether the email or the password was wrong.
- **FR-004**: System MUST keep a learner recognized as signed in across page navigation and
  reloads for the duration of their session, without repeated re-authentication.
- **FR-005**: System MUST reject any request to a protected capability (essay submission,
  workspace, profile — per `001-ielts-score-assessment` and `002-core-app-ux`) that lacks a
  valid, unexpired signed-in session.
- **FR-006**: System MUST let a signed-in learner sign out, after which that session can no
  longer be used to access protected capabilities.
- **FR-007**: System MUST store only the account data needed to authenticate a learner and
  display their profile (Constitution Principle VII) — never a plaintext password.
- **FR-008**: Sign-up and sign-in are limited to email + password for this MVP; social/OAuth
  sign-in (e.g. Google) is out of scope and may be added later without changing this feature's
  other requirements.
- **FR-009**: Self-service "forgot password" reset is out of scope for this MVP; a locked-out
  learner is handled outside the product (e.g. manual support) until a later feature adds it.
- **FR-010**: A signed-in learner's session MUST remain usable for a bounded but comfortably long
  period without requiring re-entry of credentials during normal daily use — short individual
  sign-ins are refreshed silently in the background, while the overall session expires after an
  extended period of inactivity (on the order of days to weeks, finalized during planning).

### Key Entities

- **Account**: A learner's registration record — unique email, password credential (stored as a
  salted hash, never plaintext), display name, and creation timestamp. This is the same
  `Account` entity that `001-ielts-score-assessment` and `002-core-app-ux` reference by ID; this
  feature is the owner of its authentication-relevant fields.
- **Session**: A record of one signed-in period for an account — enough information to recognize
  a learner as signed in on subsequent requests, support silent renewal during active use per
  FR-010, and invalidate that recognition on sign-out or expiry, without needing to re-verify the
  password each time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can create an account and reach the workspace in under 1 minute in a
  usability check.
- **SC-002**: 100% of requests to protected capabilities without a valid session are rejected
  rather than served.
- **SC-003**: A signed-in learner is not asked to re-enter credentials more than once per session
  during normal use (navigating pages, submitting essays).
- **SC-004**: Sign-out takes effect immediately — 0% of requests using a signed-out session
  succeed in a verification check.
- **SC-005**: Incorrect sign-in attempts never reveal whether the email or the password was the
  incorrect part, verified across 100% of tested failure cases.

## Assumptions

- This feature defines the authentication capability that `001-ielts-score-assessment` (essay
  submission) and `002-core-app-ux` (workspace/profile access) depend on; it does not re-specify
  those features' own requirements.
- Learners authenticate with an email address and a password unless FR-008 resolves otherwise.
- "Session" here is a business concept (a learner is recognized as signed in or not); the
  specific mechanism (e.g. JWT, as named in the originating request) is a technical decision to
  be finalized during planning, not fixed by this spec.
- Password reset and OAuth/social sign-in are explicitly deferred (FR-008, FR-009); this spec's
  scope is account creation, sign-in, session persistence/renewal, and sign-out only.
