import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { getSubscription } from "@/lib/billing/lemonsqueezy-client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can manage billing" }, { status: 403 });
  }

  const orgId = user.userDoc.organizationId;
  const orgSnap = await getAdminFirestore().doc(firestorePaths.organization(orgId)).get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization?.subscription.lemonSqueezySubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    const subscription = await getSubscription(organization.subscription.lemonSqueezySubscriptionId);
    return NextResponse.json({ url: subscription.attributes.urls.customer_portal });
  } catch (err) {
    console.error("LemonSqueezy subscription lookup failed", err);
    return NextResponse.json(
      { error: "Couldn't open the billing portal. Please try again in a moment." },
      { status: 502 }
    );
  }
}
