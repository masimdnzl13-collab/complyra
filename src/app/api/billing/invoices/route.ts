import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { listSubscriptionInvoices } from "@/lib/billing/lemonsqueezy-client";

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
    return NextResponse.json({ invoices: [] });
  }

  const invoices = await listSubscriptionInvoices(organization.subscription.lemonSqueezySubscriptionId);
  return NextResponse.json({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      total: inv.attributes.total_formatted,
      status: inv.attributes.status,
      createdAt: inv.attributes.created_at,
      url: inv.attributes.urls.invoice_url,
    })),
  });
}
