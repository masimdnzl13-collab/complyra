import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { firestorePaths, type UserDoc } from "@/lib/firestore/schema";

/** Mints a session cookie from a freshly-obtained Firebase ID token. */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`auth-session:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { idToken } = await request.json();
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
  }

  try {
    // Reject tampered/expired tokens before minting a longer-lived cookie from them.
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    const userDocSnap = await getAdminFirestore().doc(firestorePaths.user(decoded.uid)).get();
    const userDoc = userDocSnap.data() as UserDoc | undefined;
    if (userDoc) {
      await getAdminFirestore()
        .collection(firestorePaths.auditLog(userDoc.organizationId))
        .add({
          actorId: decoded.uid,
          action: "user_login",
          targetCollection: "users",
          targetId: decoded.uid,
          timestamp: FieldValue.serverTimestamp(),
        });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to create session" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
      const userDocSnap = await getAdminFirestore().doc(firestorePaths.user(decoded.uid)).get();
      const userDoc = userDocSnap.data() as UserDoc | undefined;
      if (userDoc) {
        await getAdminFirestore()
          .collection(firestorePaths.auditLog(userDoc.organizationId))
          .add({
            actorId: decoded.uid,
            action: "user_logout",
            targetCollection: "users",
            targetId: decoded.uid,
            timestamp: FieldValue.serverTimestamp(),
          });
      }
      // Invalidates the session everywhere, not just this browser — clearing
      // the cookie alone leaves the underlying Firebase session valid until
      // it naturally expires.
      await getAdminAuth().revokeRefreshTokens(decoded.uid);
    } catch {
      // Malformed/already-expired cookie — nothing to revoke, still clear it below.
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
