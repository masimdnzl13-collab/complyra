import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths } from "@/lib/firestore/schema";
import { siteConfig } from "@/config/site";
import { sendConsultantInviteEmail } from "@/lib/email/send-consultant-invite-email";

const INVITE_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can invite consultants" }, { status: 403 });
  }

  const { email } = await request.json().catch(() => ({}));
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const token = randomBytes(24).toString("base64url");
  const inviteRef = db.collection(firestorePaths.consultantInvites()).doc();
  const auditRef = db.collection(firestorePaths.platformAuditLog()).doc();

  const batch = db.batch();
  batch.set(inviteRef, {
    email: email.trim().toLowerCase(),
    token,
    status: "pending",
    invitedBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + INVITE_EXPIRY_MS),
  });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "consultant_invited",
    targetCollection: "consultantInvites",
    targetId: inviteRef.id,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { email: email.trim().toLowerCase() },
  });
  await batch.commit();

  const inviteUrl = new URL(`/consultant-invite/${token}`, siteConfig.url).toString();

  try {
    await sendConsultantInviteEmail({ to: email, inviteUrl });
  } catch {
    return NextResponse.json({ error: "Invite was created but the email could not be sent" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
