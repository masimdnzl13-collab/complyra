import { pricingPlans, type PricingPlan } from "@/config/site";

export function findPlanByVariantId(variantId: string | number): { plan: PricingPlan; interval: "month" | "year" } | null {
  const id = String(variantId);
  for (const plan of pricingPlans) {
    if (plan.lemonSqueezy.variantIdMonthly === id) return { plan, interval: "month" };
    if (plan.lemonSqueezy.variantIdYearly === id) return { plan, interval: "year" };
  }
  return null;
}
