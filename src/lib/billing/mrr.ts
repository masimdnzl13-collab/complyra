import "server-only";
import type { OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans, type PlanId } from "@/config/site";

export interface MrrBreakdown {
  mrr: number;
  activeCount: number;
  planCounts: Record<PlanId, number>;
}

/** Single source of truth for "what counts as a paying, active subscription" — reused by /admin, /admin/analytics, and the billing-sweep snapshot. */
export function calculateMrr(organizations: OrganizationDoc[]): MrrBreakdown {
  const planCounts: Record<PlanId, number> = { free: 0, starter: 0, growth: 0, scale: 0 };
  let mrr = 0;
  let activeCount = 0;

  for (const org of organizations) {
    planCounts[org.subscription.planId] = (planCounts[org.subscription.planId] ?? 0) + 1;
    const isPaying = org.subscription.planId !== "free" && org.subscription.status !== "cancelled";
    if (!isPaying) continue;
    const plan = pricingPlans.find((p) => p.id === org.subscription.planId);
    if (!plan) continue;
    activeCount++;
    mrr += org.subscription.billingInterval === "year" ? plan.priceYearly / 12 : plan.price;
  }

  return { mrr, activeCount, planCounts };
}
