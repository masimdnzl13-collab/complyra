import "server-only";
import type { OrganizationDoc } from "@/lib/firestore/schema";
import { checkMonthlyQuota, checkPastDue, type QuotaCheckResult } from "@/lib/billing/quota";
import { getEffectivePlan } from "@/lib/billing/effective-plan";

export type { QuotaCheckResult };

/**
 * Free plan gets static checklists/templates but not AI-customized text
 * generation — limit is 0 there, which gets its own message pointing at
 * Starter rather than the generic "reached your limit" wording. Superadmins
 * (SUPERADMIN_UIDS) resolve to the top-tier plan via getEffectivePlan, whose
 * article50TextsPerMonth is "unlimited", so this gate and the monthly quota
 * below both clear automatically — no separate bypass needed here.
 */
export function checkArticle50TextQuota(organization: OrganizationDoc, uid?: string | null): QuotaCheckResult {
  const pastDue = checkPastDue(organization, uid);
  if (pastDue) {
    return { allowed: false, error: pastDue, monthIsStale: false, currentMonthKey: "" };
  }

  const plan = getEffectivePlan(uid, organization.subscription.planId);
  if (plan.article50TextsPerMonth === 0) {
    return {
      allowed: false,
      error: "Custom Article 50 text generation requires the Starter plan or higher. Static checklists and templates stay available on every plan.",
      monthIsStale: false,
      currentMonthKey: "",
    };
  }

  return checkMonthlyQuota(organization, "article50Texts", 1, uid);
}
