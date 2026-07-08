import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans } from "@/config/site";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const snap = await getAdminFirestore().collection(firestorePaths.organizations()).get();
  const rows = [
    ["Organization", "Plan", "MRR (EUR)", "Status", "Billing interval", "Start date", "Next billing date"],
  ];

  for (const doc of snap.docs) {
    const org = doc.data() as OrganizationDoc;
    const plan = pricingPlans.find((p) => p.id === org.subscription.planId);
    const isPaying = org.subscription.planId !== "free" && org.subscription.status !== "cancelled";
    const mrr = isPaying && plan ? (org.subscription.billingInterval === "year" ? plan.priceYearly / 12 : plan.price) : 0;
    rows.push([
      org.companyName,
      plan?.name ?? org.subscription.planId,
      mrr.toFixed(2),
      org.subscription.status,
      org.subscription.billingInterval ?? "",
      org.subscription.currentPeriodStart ? org.subscription.currentPeriodStart.toDate().toISOString().slice(0, 10) : "",
      org.subscription.nextBillingDate ? org.subscription.nextBillingDate.toDate().toISOString().slice(0, 10) : "",
    ]);
  }

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="complyra-subscriptions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
