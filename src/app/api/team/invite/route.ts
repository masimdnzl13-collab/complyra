import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths } from "@/lib/firestore/schema";
import { siteConfig } from "@/config/site";
import { sendInviteEmail } from "@/lib/email/send-invite-email";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json(
      { error: "Only the organization owner can invite teammates" },
      { status: 403 }
    );
  }

  const { email } = await request.json();
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const orgSnap = await db.doc(firestorePaths.organization(orgId)).get();
  const companyName = (orgSnap.data()?.companyName as string | undefined) ?? siteConfig.name;

  const token = randomBytes(24).toString("base64url");
  const inviteRef = db.collection(firestorePaths.invites(orgId)).doc();
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();

  const batch = db.batch();
  batch.set(inviteRef, {
    email: email.trim().toLowerCase(),
    role: "member",
    token,
    status: "pending",
    invitedBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + INVITE_EXPIRY_MS),
  });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "invite_sent",
    targetCollection: "invites",
    targetId: inviteRef.id,
    timestamp: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  const inviteUrl = new URL(`/invite/${token}`, siteConfig.url).toString();

  try {
    await sendInviteEmail({ to: email, organizationName: companyName, inviteUrl });
  } catch {
    return NextResponse.json(
      { error: "Invite was created but the email could not be sent" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
