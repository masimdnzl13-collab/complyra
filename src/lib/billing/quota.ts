import "server-only";
import type { OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans } from "@/config/site";
import { getCurrentMonthKey } from "@/lib/usage/monthly-quota";

export type MonthlyQuotaType = "assessments" | "documents" | "article50Texts";

const QUOTA_FIELDS: Record<
  MonthlyQuotaType,
  {
    usageKey: "assessmentsThisMonth" | "documentsGeneratedThisMonth" | "article50TextsThisMonth";
    planKey: "assessmentsPerMonth" | "documentsPerMonth" | "article50TextsPerMonth";
    label: string;
  }
> = {
  assessments: { usageKey: "assessmentsThisMonth", planKey: "assessmentsPerMonth", label: "risk assessments" },
  documents: { usageKey: "documentsGeneratedThisMonth", planKey: "documentsPerMonth", label: "documents" },
  article50Texts: { usageKey: "article50TextsThisMonth", planKey: "article50TextsPerMonth", label: "AI-customized Article 50 texts" },
};

export interface QuotaCheckResult {
  allowed: boolean;
  error?: string;
  /** True when the stored usageMonthKey is stale — callers should reset the counter to `increment` rather than incrementing it. */
  monthIsStale: boolean;
  currentMonthKey: string;
}

const PAST_DUE_MESSAGE = "Your subscription payment is overdue. Please update your payment method.";

/** Step 2 of the spec's quota flow — checked on its own so non-monthly-quota routes (AI systems, AI literacy seats) can reuse it without the monthly-counter machinery. */
export function checkPastDue(organization: OrganizationDoc): string | null {
  return organization.subscription.status === "past_due" ? PAST_DUE_MESSAGE : null;
}

/** Steps 2–3 of the spec's quota flow for a monthly-reset counter. Step 4 (increment) and step 5 (audit log) stay in the caller, alongside the route's own Firestore batch. */
export function checkMonthlyQuota(organization: OrganizationDoc, type: MonthlyQuotaType, amount = 1): QuotaCheckResult {
  const currentMonthKey = getCurrentMonthKey();
  const pastDue = checkPastDue(organization);
  if (pastDue) {
    return { allowed: false, error: pastDue, monthIsStale: false, currentMonthKey };
  }

  const { usageKey, planKey, label } = QUOTA_FIELDS[type];
  const monthIsStale = organization.usage.usageMonthKey !== currentMonthKey;
  const usedThisMonth = monthIsStale ? 0 : organization.usage[usageKey] ?? 0;

  const plan = pricingPlans.find((p) => p.id === organization.subscription.planId);
  const limit = plan?.[planKey] ?? 0;

  if (limit !== "unlimited" && usedThisMonth + amount > limit) {
    return {
      allowed: false,
      error: `You've reached your monthly limit for ${label} (${limit}/month on the ${plan?.name ?? "current"} plan). Upgrade to continue.`,
      monthIsStale,
      currentMonthKey,
    };
  }

  return { allowed: true, monthIsStale, currentMonthKey };
}
