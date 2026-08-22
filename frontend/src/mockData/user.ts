/**
 * The demo account.
 *
 * One account, because mock mode has no notion of "other users" — every session is this
 * learner. `signUp` overrides the email and display name with whatever was typed so the
 * product does not greet a new visitor by someone else's name.
 */

export interface MockAccount {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export const DEMO_ACCOUNT: MockAccount = {
  id: "acc_8f2c1d90",
  email: "learner@writewise.app",
  display_name: "Minh Anh",
  created_at: "2026-05-14T09:12:00.000Z",
};

/** Mock mode accepts any credentials; this is the only rule it enforces. */
export const MIN_PASSWORD_LENGTH = 8;
