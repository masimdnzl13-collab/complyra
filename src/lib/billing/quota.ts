import "server-only";
import type { OrganizationDoc } from "@/lib/firestore/schema";
import { getCurrentMonthKey } from "@/lib/usage/monthly-quota";
import { getEffectivePlan, getEffectivePlanId, isUnlimitedUser } from "@/lib/billing/effective-plan";
import { planHasExpertReviewAccess } from "@/config/site";

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

/** Step 2 of the spec's quota flow — checked on its own so non-monthly-quota routes (AI systems, AI literacy seats) can reuse it without the monthly-counter machinery. Pass the acting user's uid so superadmins (SUPERADMIN_UIDS) bypass past-due blocking, same as every other billing gate. */
export function checkPastDue(organization: OrganizationDoc, uid?: string | null): string | null {
  if (isUnlimitedUser(uid)) return null;
  return organization.subscription.status === "past_due" ? PAST_DUE_MESSAGE : null;
}

/** Steps 2–3 of the spec's quota flow for a monthly-reset counter. Step 4 (increment) and step 5 (audit log) stay in the caller, alongside the route's own Firestore batch. */
export function checkMonthlyQuota(
  organization: OrganizationDoc,
  type: MonthlyQuotaType,
  amount = 1,
  uid?: string | null
): QuotaCheckResult {
  const currentMonthKey = getCurrentMonthKey();
  const pastDue = checkPastDue(organization, uid);
  if (pastDue) {
    return { allowed: false, error: pastDue, monthIsStale: false, currentMonthKey };
  }

  const { usageKey, planKey, label } = QUOTA_FIELDS[type];
  const monthIsStale = organization.usage.usageMonthKey !== currentMonthKey;
  const usedThisMonth = monthIsStale ? 0 : organization.usage[usageKey] ?? 0;

  const plan = getEffectivePlan(uid, organization.subscription.planId);
  const limit = plan[planKey];

  if (limit !== "unlimited" && usedThisMonth + amount > limit) {
    return {
      allowed: false,
      error: `You've reached your monthly limit for ${label} (${limit}/month on the ${plan.name} plan). Upgrade to continue.`,
      monthIsStale,
      currentMonthKey,
    };
  }

  return { allowed: true, monthIsStale, currentMonthKey };
}

export interface SimpleGateResult {
  allowed: boolean;
  error?: string;
}

/** AI system count cap — checked before registering a new system. Not a monthly counter, so it's separate from checkMonthlyQuota. */
export function checkSystemsLimit(organization: OrganizationDoc, uid?: string | null): SimpleGateResult {
  const plan = getEffectivePlan(uid, organization.subscription.planId);
  const limit = plan.systemsLimit;
  if (limit !== "unlimited" && organization.usage.registeredSystemsCount >= limit) {
    return {
      allowed: false,
      error: `Your ${plan.name} plan supports up to ${limit} AI system${limit === 1 ? "" : "s"}. Upgrade your plan to add more.`,
    };
  }
  return { allowed: true };
}

/** AI literacy seat cap. seatsUsed is a live count() over trainingRecords (see P10) — not a stored usage counter — so it's passed in rather than read off `organization.usage`. */
export function checkAiLiteracySeatLimit(
  organization: OrganizationDoc,
  seatsUsed: number,
  uid?: string | null
): SimpleGateResult {
  const plan = getEffectivePlan(uid, organization.subscription.planId);
  const seatLimit = plan.aiLiteracySeats;
  if (seatLimit !== "unlimited" && seatsUsed >= seatLimit) {
    return {
      allowed: false,
      error: `Your ${plan.name} plan supports AI literacy training for up to ${seatLimit} employees. Upgrade your plan to add more.`,
    };
  }
  return { allowed: true };
}

/** Expert-review plan-tier gate (Growth/Scale only) — a tier check, not a numeric quota. */
export function checkExpertReviewAccess(organization: OrganizationDoc, uid?: string | null): SimpleGateResult {
  const planId = getEffectivePlanId(uid, organization.subscription.planId);
  if (!planHasExpertReviewAccess(planId)) {
    return { allowed: false, error: "Upgrade to Growth for expert review" };
  }
  return { allowed: true };
}
