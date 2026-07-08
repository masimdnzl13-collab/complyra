import "server-only";
import type { OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans } from "@/config/site";
import { checkMonthlyQuota, checkPastDue, type QuotaCheckResult } from "@/lib/billing/quota";

export type { QuotaCheckResult };

/**
 * Free plan gets static checklists/templates but not AI-customized text
 * generation — limit is 0 there, which gets its own message pointing at
 * Starter rather than the generic "reached your limit" wording.
 */
export function checkArticle50TextQuota(organization: OrganizationDoc): QuotaCheckResult {
  const pastDue = checkPastDue(organization);
  if (pastDue) {
    return { allowed: false, error: pastDue, monthIsStale: false, currentMonthKey: "" };
  }

  const plan = pricingPlans.find((p) => p.id === organization.subscription.planId);
  if (plan?.article50TextsPerMonth === 0) {
    return {
      allowed: false,
      error: "Custom Article 50 text generation requires the Starter plan or higher. Static checklists and templates stay available on every plan.",
      monthIsStale: false,
      currentMonthKey: "",
    };
  }

  return checkMonthlyQuota(organization, "article50Texts");
}
