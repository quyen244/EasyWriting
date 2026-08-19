"use client";

/**
 * Auth context/hook (003-account-authentication research.md decision 7). Consumed by
 * 002-core-app-ux's pages — this file builds no page UI of its own, only state + behavior:
 *
 *  - On mount, silently attempts a refresh (the httpOnly cookie is the only thing a
 *    returning visitor has; there is no access token in memory yet) to restore a session
 *    without asking the learner to re-enter credentials (spec FR-004).
 *  - Schedules a silent re-refresh ~60s before the current access token expires, so an
 *    active learner is never interrupted mid-session (spec FR-010).
 *
 * `.tsx`, not `.ts` (a deviation from the literal path plan.md/tasks.md named): the Provider
 * needs real JSX, not `React.createElement`, to satisfy React 19's compiler-backed lint rules
 * (ref-safety analysis flags manual createElement calls). Import sites are unaffected —
 * `@/hooks/useAuth` resolves the same either way.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AuthApiError,
  me as fetchMe,
  refresh as refreshSession,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
  type Account,
  type SigninInput,
  type SignupInput,
} from "@/lib/auth";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  account: Account | null;
  accessToken: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (input: SigninInput) => Promise<void>;
  signUp: (input: SignupInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const REFRESH_SAFETY_MARGIN_SECONDS = 60;
const MIN_REFRESH_DELAY_MS = 5_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "checking",
    account: null,
    accessToken: null,
  });
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimer.current !== null) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  // Holds the latest "perform a silent refresh, then reschedule" logic. The setTimeout
  // below always calls through this ref rather than closing over `performRefresh`
  // directly, which avoids a scheduleSilentRefresh <-> performRefresh circular
  // useCallback dependency (each would otherwise need the other in its deps array).
  const performRefreshRef = useRef<() => Promise<void>>(async () => {});

  const scheduleSilentRefresh = useCallback(
    (expiresInSeconds: number) => {
      clearScheduledRefresh();
      const delayMs = Math.max(
        (expiresInSeconds - REFRESH_SAFETY_MARGIN_SECONDS) * 1000,
        MIN_REFRESH_DELAY_MS
      );
      refreshTimer.current = setTimeout(() => {
        void performRefreshRef.current();
      }, delayMs);
    },
    [clearScheduledRefresh]
  );

  useEffect(() => {
    performRefreshRef.current = async () => {
      try {
        const response = await refreshSession();
        if (!isMounted.current) return;
        setState({
          status: "authenticated",
          account: response.user,
          accessToken: response.access_token,
        });
        scheduleSilentRefresh(response.expires_in);
      } catch {
        if (!isMounted.current) return;
        clearScheduledRefresh();
        setState({ status: "unauthenticated", account: null, accessToken: null });
      }
    };
  }, [clearScheduledRefresh, scheduleSilentRefresh]);

  useEffect(() => {
    isMounted.current = true;
    void performRefreshRef.current();
    return () => {
      isMounted.current = false;
      clearScheduledRefresh();
    };
  }, [clearScheduledRefresh]);

  const signIn = useCallback(
    async (input: SigninInput) => {
      const response = await apiSignIn(input);
      setState({
        status: "authenticated",
        account: response.user,
        accessToken: response.access_token,
      });
      scheduleSilentRefresh(response.expires_in);
    },
    [scheduleSilentRefresh]
  );

  const signUp = useCallback(
    async (input: SignupInput) => {
      const response = await apiSignUp(input);
      setState({
        status: "authenticated",
        account: response.user,
        accessToken: response.access_token,
      });
      scheduleSilentRefresh(response.expires_in);
    },
    [scheduleSilentRefresh]
  );

  const signOut = useCallback(async () => {
    clearScheduledRefresh();
    try {
      if (state.accessToken) {
        await apiSignOut(state.accessToken);
      }
    } catch (error) {
      // Best-effort: even if the network call fails, the learner's local session ends.
      // A stale-but-unusable refresh cookie on the server is not a security issue here —
      // it simply won't validate on its next use.
      if (!(error instanceof AuthApiError)) throw error;
    } finally {
      setState({ status: "unauthenticated", account: null, accessToken: null });
    }
  }, [clearScheduledRefresh, state.accessToken]);

  const value: AuthContextValue = { ...state, signIn, signUp, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/** Exposed for 002's ProtectedRoute guard (contracts/page-routes.md) without re-fetching /me. */
export async function fetchCurrentAccount(accessToken: string): Promise<Account> {
  return fetchMe(accessToken);
}
