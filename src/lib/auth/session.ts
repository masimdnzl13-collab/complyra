import "server-only";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "./constants";

/**
 * The authoritative auth check: verifies the session cookie against
 * Firebase Auth via the Admin SDK. This — not the cookie-presence check in
 * src/middleware.ts — is what actually guards protected pages and API
 * routes; middleware only redirects early as a UX optimization.
 */
export async function getSessionUser(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
