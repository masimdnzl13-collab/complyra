import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans, type PlanId } from "@/config/site";
import { createCheckoutUrl } from "@/lib/billing/lemonsqueezy-client";

interface RequestBody {
  planId: PlanId;
  interval: "month" | "year";
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.planId === "string" &&
    pricingPlans.some((p) => p.id === b.planId) &&
    (b.interval === "month" || b.interval === "year")
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can manage billing" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const plan = pricingPlans.find((p) => p.id === body.planId);
  if (!plan || plan.id === "free") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const variantId = body.interval === "year" ? plan.lemonSqueezy.variantIdYearly : plan.lemonSqueezy.variantIdMonthly;
  if (!variantId) {
    return NextResponse.json(
      { error: "This plan isn't available for checkout yet. Please check back soon." },
      { status: 503 }
    );
  }

  const orgId = user.userDoc.organizationId;
  const orgSnap = await getAdminFirestore().doc(firestorePaths.organization(orgId)).get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const url = await createCheckoutUrl({
    variantId,
    orgId,
    orgName: organization.companyName,
    userEmail: user.email,
  });

  return NextResponse.json({ url });
}
