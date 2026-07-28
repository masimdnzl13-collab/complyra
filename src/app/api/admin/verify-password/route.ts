import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import {
  ADMIN_GATE_COOKIE_NAME,
  ADMIN_GATE_MAX_AGE_SECONDS,
  signAdminGateToken,
  verifyAdminPassword,
} from "@/lib/auth/admin-gate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";

/**
 * Only reachable by a session already on the SUPERADMIN_UIDS allowlist — the
 * password here is a second factor for that one account, not a public gate,
 * so the rate limit below is guarding a stolen/shared session against a
 * short password, not the internet at large.
 */
export async function POST(request: NextRequest) {
  const admin = await getCurrentSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-gate:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const storedHash = process.env.ADMIN_PANEL_PASSWORD_HASH;
  const ok = Boolean(password) && Boolean(storedHash) && verifyAdminPassword(password, storedHash!);

  if (admin.userDoc) {
    await getAdminFirestore()
      .collection(firestorePaths.auditLog(admin.userDoc.organizationId))
      .add({
        actorId: admin.uid,
        action: ok ? "admin_password_verified" : "admin_password_failed",
        targetCollection: "admin",
        targetId: "panel",
        timestamp: FieldValue.serverTimestamp(),
      });
  }

  if (!ok) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_GATE_COOKIE_NAME, signAdminGateToken(admin.uid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_GATE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
