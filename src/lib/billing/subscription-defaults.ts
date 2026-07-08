import type { OrganizationSubscription } from "@/lib/firestore/schema";

/** The subscription shape a brand-new org gets, and what an org resets to on cancellation/force-downgrade. */
export function freeSubscription(): OrganizationSubscription {
  return {
    planId: "free",
    status: "active",
    billingInterval: null,
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
  };
}
