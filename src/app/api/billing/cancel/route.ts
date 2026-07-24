import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { cancelSubscription } from "@/lib/billing/lemonsqueezy-client";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can manage billing" }, { status: 403 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const orgRef = db.doc(firestorePaths.organization(orgId));
  const orgSnap = await orgRef.get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }
  if (!organization.subscription.lemonSqueezySubscriptionId) {
    return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
  }

  // Cancels at the end of the current billing period. Firestore's
  // subscription.status is updated by the subscription_cancelled webhook,
  // not here, so it never drifts if this call succeeds but the webhook is
  // delayed or retried.
  try {
    await cancelSubscription(organization.subscription.lemonSqueezySubscriptionId);
  } catch (err) {
    console.error("LemonSqueezy cancellation failed", err);
    return NextResponse.json(
      { error: "Couldn't cancel your subscription. Please try again in a moment." },
      { status: 502 }
    );
  }

  await db.collection(firestorePaths.auditLog(orgId)).add({
    actorId: user.uid,
    action: "record_updated",
    targetCollection: "organizations",
    targetId: orgId,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { subscriptionEvent: "cancel_requested" },
  });

  return NextResponse.json({ ok: true });
}
