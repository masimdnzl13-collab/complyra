import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths } from "@/lib/firestore/schema";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { sendAdminSupportEmail, type SupportEmailTemplate } from "@/lib/email/send-automation-email";

const VALID_TEMPLATES: SupportEmailTemplate[] = ["payment_reminder", "usage_check_in", "general_support"];

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const { template, note } = await request.json().catch(() => ({}));
  if (!VALID_TEMPLATES.includes(template)) {
    return NextResponse.json({ error: "Invalid template" }, { status: 400 });
  }

  const ownerEmail = await getOrgOwnerEmail(params.id);
  if (!ownerEmail) return NextResponse.json({ error: "No owner email found for this organization" }, { status: 404 });

  await sendAdminSupportEmail({ to: ownerEmail, template, note: typeof note === "string" ? note : undefined });

  await getAdminFirestore()
    .collection(firestorePaths.platformAuditLog())
    .add({
      actorId: user.uid,
      action: "admin_support_email_sent",
      targetCollection: "organizations",
      targetId: params.id,
      timestamp: FieldValue.serverTimestamp(),
      metadata: { template },
    });

  return NextResponse.json({ ok: true });
}
