import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * Optimistic, cookie-presence-only redirect for a fast UX — this runs on
 * the Edge runtime and cannot verify the session cookie cryptographically
 * (that requires the Admin SDK, which needs the Node.js runtime). The
 * authoritative check is getCurrentUser() in (app)/layout.tsx and in each
 * protected API route; this middleware is a convenience layer on top, not
 * the security boundary.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];
const AUTH_ONLY_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSessionCookie && AUTH_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/register"],
};
