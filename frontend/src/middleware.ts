import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * The route guard.
 *
 * It runs before a page renders, which is the point: the alternative — deciding in the
 * browser after hydration — shows a signed-out learner the shape of the workspace for a
 * frame, and shows a signed-in one a loading state on every refresh. Neither is a bug
 * exactly, and both make the product feel unfinished.
 */

/** Everything behind the sidebar. Matched as a prefix, so `/results/abc` is covered. */
const PROTECTED_PREFIXES = [
  "/workspace",
  "/account",
  "/profile",
  "/practice",
  "/mock-test",
  "/results",
];

/** Pages that exist to get you signed in, and so are pointless once you are. */
const AUTH_PAGES = ["/signin", "/signup"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Carries the refreshed session cookies onto a redirect.
 *
 * Without this, a redirect issued mid-refresh drops the rotated tokens and the learner
 * is signed out by the very navigation meant to help them.
 */
function redirectPreservingSession(to: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(to);
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function middleware(request: NextRequest) {
  // Without a backend the app runs on mock data and guards itself in the client. Trying
  // to verify a session here would fail every request rather than none.
  if (!isSupabaseConfigured) return NextResponse.next();

  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    // So signing in returns you to what you actually asked for, not to a generic home.
    url.searchParams.set("redirect", `${pathname}${search}`);
    return redirectPreservingSession(url, response);
  }

  if (user && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";
    url.search = "";
    return redirectPreservingSession(url, response);
  }

  return response;
}

export const config = {
  // Everything except Next's own assets and image files. The auth cookie has to be
  // refreshed on ordinary navigations, not only on guarded ones, or it expires while
  // someone reads the landing page.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
