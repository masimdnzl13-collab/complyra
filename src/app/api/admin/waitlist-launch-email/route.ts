import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type NewsletterSubscriberDoc } from "@/lib/firestore/schema";
import { sendLaunchAnnouncementEmail } from "@/lib/email/send-automation-email";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const { discountNote } = await request.json().catch(() => ({}));

  const db = getAdminFirestore();
  const snap = await db.collection(firestorePaths.newsletterSubscribers()).get();
  const subscribers = snap.docs.map((d) => d.data() as NewsletterSubscriberDoc).filter((s) => !s.unsubscribed);

  let sent = 0;
  let failed = 0;
  for (const subscriber of subscribers) {
    try {
      await sendLaunchAnnouncementEmail({ to: subscriber.email, discountNote: typeof discountNote === "string" ? discountNote : undefined });
      sent++;
    } catch {
      failed++;
    }
  }

  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "admin_broadcast_sent",
    targetCollection: "newsletterSubscribers",
    targetId: "waitlist-launch-email",
    timestamp: FieldValue.serverTimestamp(),
    metadata: { sent, failed },
  });

  return NextResponse.json({ ok: true, sent, failed });
}
