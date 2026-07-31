import "server-only";
import { pricingPlans, type PlanId, type PricingPlan } from "@/config/site";
import { isSuperAdminUid } from "@/lib/auth/superadmin";

/**
 * Single choke point for "superadmins bypass billing" (SUPERADMIN_UIDS, see
 * src/lib/auth/superadmin.ts). Every plan-gate and quota check should read
 * the org's plan through getEffectivePlan()/getEffectivePlanId() here rather
 * than calling isSuperAdminUid directly — that way removing a UID from the
 * allowlist instantly restores normal plan behavior with nothing else to
 * touch, and no fake subscription/payment record is ever created.
 */
const TOP_TIER_PLAN_ID: PlanId = "scale";

export function isUnlimitedUser(uid: string | null | undefined): boolean {
  return !!uid && isSuperAdminUid(uid);
}

/** The plan a caller should be treated as having — the org's real plan, unless uid is a superadmin, who always reads as the top tier of the Free → Starter → Growth → Scale hierarchy. */
export function getEffectivePlanId(uid: string | null | undefined, actualPlanId: PlanId): PlanId {
  return isUnlimitedUser(uid) ? TOP_TIER_PLAN_ID : actualPlanId;
}

export function getEffectivePlan(uid: string | null | undefined, actualPlanId: PlanId): PricingPlan {
  const planId = getEffectivePlanId(uid, actualPlanId);
  return pricingPlans.find((p) => p.id === planId) ?? pricingPlans[0];
}
