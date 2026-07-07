/**
 * Deliberately dependency-free (no `server-only`, no firebase-admin) so
 * this can be imported from src/middleware.ts, which runs on the Edge
 * runtime and cannot load the Admin SDK.
 */
export const SESSION_COOKIE_NAME = "session";

/** Firebase session cookies max out at 14 days. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
