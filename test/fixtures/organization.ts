import type { OrganizationDoc } from "@/lib/firestore/schema";
import type { PlanId } from "@/config/site";
import { getCurrentMonthKey } from "@/lib/usage/monthly-quota";

/** Deep-merges only the two nested objects tests actually override (subscription, usage) — everything else stays at its default. */
export function makeOrganization(
  planId: PlanId,
  overrides: {
    subscription?: Partial<OrganizationDoc["subscription"]>;
    usage?: Partial<OrganizationDoc["usage"]>;
  } = {}
): OrganizationDoc {
  return {
    companyName: "Acme Test Org",
    country: "DE",
    industry: "Software",
    employeeCountRange: "1-10",
    euRelation: { isEuBased: true, sellsToEu: true },
    aiUsageContext: "products",
    createdAt: null as never,
    subscription: {
      planId,
      status: "active",
      billingInterval: "month",
      lemonSqueezyCustomerId: null,
      lemonSqueezySubscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      nextBillingDate: null,
      cardBrand: null,
      cardLastFour: null,
      trialEndDate: null,
      trialStatus: null,
      pastDueSince: null,
      ...overrides.subscription,
    },
    usage: {
      documentsGeneratedThisMonth: 0,
      assessmentsThisMonth: 0,
      article50TextsThisMonth: 0,
      registeredSystemsCount: 0,
      expertReviewsThisMonth: 0,
      usageMonthKey: getCurrentMonthKey(),
      ...overrides.usage,
    },
  };
}

/** A UID that is never in SUPERADMIN_UIDS during tests — a plain normal user. */
export const NORMAL_UID = "normal-user-uid";

/** Matches the SUPERADMIN_UIDS value tests stub in via vi.stubEnv. */
export const SUPERADMIN_UID = "superadmin-uid";
