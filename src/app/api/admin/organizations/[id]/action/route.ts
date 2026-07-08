import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type AuditAction, type OrganizationDoc } from "@/lib/firestore/schema";
import { freeSubscription } from "@/lib/billing/subscription-defaults";
import { getCurrentMonthKey } from "@/lib/usage/monthly-quota";
import { cancelSubscription } from "@/lib/billing/lemonsqueezy-client";

type SupportAction = "reset_usage" | "force_downgrade" | "cancel_subscription" | "suspend" | "unsuspend";

const ACTION_AUDIT: Record<SupportAction, AuditAction> = {
  reset_usage: "admin_usage_reset",
  force_downgrade: "admin_force_downgrade",
  cancel_subscription: "admin_subscription_cancelled",
  suspend: "admin_org_suspended",
  unsuspend: "admin_org_unsuspended",
};

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const { action } = await request.json().catch(() => ({}));
  if (!Object.keys(ACTION_AUDIT).includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const orgRef = db.doc(firestorePaths.organization(params.id));
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const organization = orgSnap.data() as OrganizationDoc;

  switch (action as SupportAction) {
    case "reset_usage":
      await orgRef.update({
        "usage.assessmentsThisMonth": 0,
        "usage.documentsGeneratedThisMonth": 0,
        "usage.article50TextsThisMonth": 0,
        "usage.expertReviewsThisMonth": 0,
        "usage.usageMonthKey": getCurrentMonthKey(),
      });
      break;
    case "force_downgrade":
      await orgRef.update({ subscription: freeSubscription() });
      break;
    case "cancel_subscription":
      if (organization.subscription.lemonSqueezySubscriptionId) {
        await cancelSubscription(organization.subscription.lemonSqueezySubscriptionId).catch(() => {});
      }
      await orgRef.update({ "subscription.status": "cancelled" });
      break;
    case "suspend":
      await orgRef.update({ suspended: true });
      break;
    case "unsuspend":
      await orgRef.update({ suspended: false });
      break;
  }

  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: ACTION_AUDIT[action as SupportAction],
    targetCollection: "organizations",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
