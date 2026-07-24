import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans, siteConfig, brandColors, type PlanId } from "@/config/site";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { getResendClient } from "@/lib/email/resend";

type Audience = "all" | PlanId;

interface BroadcastInput {
  title: string;
  message: string;
  audience: Audience;
}

function isValid(body: unknown): body is BroadcastInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const validAudiences: Audience[] = ["all", ...pricingPlans.map((p) => p.id)];
  return (
    typeof b.title === "string" &&
    b.title.trim().length > 0 &&
    typeof b.message === "string" &&
    b.message.trim().length > 0 &&
    validAudiences.includes(b.audience as Audience)
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValid(body)) {
    return NextResponse.json({ error: "Please fill in every field" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const orgsSnap = await db.collection(firestorePaths.organizations()).get();
  const targets =
    body.audience === "all"
      ? orgsSnap.docs
      : orgsSnap.docs.filter((d) => (d.data() as OrganizationDoc).subscription.planId === body.audience);

  const resend = getResendClient();
  let sent = 0;
  let failed = 0;
  for (const doc of targets) {
    const ownerEmail = await getOrgOwnerEmail(doc.id);
    if (!ownerEmail) continue;
    try {
      const { error } = await resend.emails.send({
        from: `${siteConfig.name} <${siteConfig.contact.transactionalFrom}>`,
        to: ownerEmail,
        subject: body.title,
        html: `
          <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <p style="color: ${brandColors.navy[900]}; font-size: 20px; font-weight: 600; margin: 0 0 24px;">${siteConfig.name}</p>
            <p style="color: ${brandColors.navy[900]}; font-size: 16px; line-height: 1.5; margin: 0;">${body.message}</p>
          </div>
        `,
      });
      if (error) throw new Error(error.message);
      sent++;
    } catch {
      failed++;
    }
  }

  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "admin_broadcast_sent",
    targetCollection: "organizations",
    targetId: body.audience,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { title: body.title, audience: body.audience, sent, failed },
  });

  return NextResponse.json({ ok: true, sent, failed });
}
