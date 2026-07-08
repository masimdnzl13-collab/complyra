import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans, planHasExpertReviewAccess, siteConfig } from "@/config/site";
import { getCurrentMonthKey } from "@/lib/usage/monthly-quota";
import { freeSubscription } from "@/lib/billing/subscription-defaults";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { getSubscription } from "@/lib/billing/lemonsqueezy-client";
import { sendRenewalReminderEmail, sendTrialEndingEmail, sendPaymentFailedEmail } from "@/lib/email/send-billing-email";
import {
  sendSubscriptionRenewedEmail,
  sendTrialConvertedEmail,
  sendTrialEndedEmail,
  sendPaymentOverdueEmail,
  sendSubscriptionDowngradedEmail,
} from "@/lib/email/send-automation-email";
import { canSendRenewalReminder } from "@/lib/email/preferences";
import { authorizeCronRequest } from "@/lib/cron/authorize";
import { withCronRunLogging } from "@/lib/cron/log-run";

/**
 * Runs daily at 00:00 UTC (see vercel.json). Six jobs against every org:
 *  1. Reset any org whose usageMonthKey has gone stale (lazy-reset safety net).
 *  2. Downgrade cancelled subscriptions whose currentPeriodEnd has passed —
 *     safety net for a missed `subscription_expired` webhook.
 *  3. Proactively query LemonSqueezy for orgs whose currentPeriodEnd is
 *     today, so a renewal (or its failure) is reflected even if the webhook
 *     delivery is delayed or dropped.
 *  4. Same proactive check for orgs whose trial ends today: converted to
 *     paid, or downgraded to Free.
 *  5. Trial-ending and renewal reminder emails, exactly 3 days out.
 *  6. Payment-overdue escalation: a day-1 reminder, then a day-3+ downgrade
 *     for orgs sitting in `past_due` (tracked via `pastDueSince`).
 */
export async function GET(request: NextRequest) {
  const auth = await authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await withCronRunLogging("billing-sweep", auth.triggeredBy, async (counters) => {
    const db = getAdminFirestore();
    const now = new Date();
    const currentMonthKey = getCurrentMonthKey(now);

    const orgsSnap = await db.collection(firestorePaths.organizations()).get();
    counters.processedCount = orgsSnap.size;

    let monthlyResets = 0;
    let downgrades = 0;
    let renewalsChecked = 0;
    let trialsChecked = 0;
    let trialReminders = 0;
    let renewalReminders = 0;
    let overdueReminders = 0;
    let overdueDowngrades = 0;

    const sendEmail = async (fn: () => Promise<void>) => {
      try {
        await fn();
        counters.emailsSent++;
      } catch {
        counters.emailsFailed++;
      }
    };

    for (const doc of orgsSnap.docs) {
      const org = doc.data() as OrganizationDoc;
      const orgId = doc.id;
      const sub = org.subscription;

      if (org.usage.usageMonthKey !== currentMonthKey) {
        await doc.ref.update({
          "usage.documentsGeneratedThisMonth": 0,
          "usage.assessmentsThisMonth": 0,
          "usage.article50TextsThisMonth": 0,
          "usage.expertReviewsThisMonth": 0,
          "usage.usageMonthKey": currentMonthKey,
        });
        monthlyResets++;
      }

      if (sub.status === "cancelled" && sub.currentPeriodEnd && sub.currentPeriodEnd.toDate() <= now) {
        await doc.ref.update({ subscription: freeSubscription() });
        await db.collection(firestorePaths.auditLog(orgId)).add({
          actorId: "billing-cron",
          action: "record_updated",
          targetCollection: "organizations",
          targetId: orgId,
          timestamp: FieldValue.serverTimestamp(),
          metadata: { subscriptionEvent: "cron_downgrade_to_free" },
        });
        downgrades++;
        continue;
      }

      const isToday = (ts: typeof sub.currentPeriodEnd) => !!ts && isSameUtcDay(ts.toDate(), now);

      if (sub.status === "active" && sub.lemonSqueezySubscriptionId && isToday(sub.currentPeriodEnd)) {
        renewalsChecked++;
        try {
          const lsSub = await getSubscription(sub.lemonSqueezySubscriptionId);
          const ownerEmail = await getOrgOwnerEmail(orgId);
          const plan = pricingPlans.find((p) => p.id === sub.planId);
          if (lsSub.attributes.status === "active") {
            await doc.ref.update({
              "subscription.currentPeriodStart": Timestamp.now(),
              "subscription.currentPeriodEnd": toTimestamp(lsSub.attributes.renews_at),
              "subscription.nextBillingDate": toTimestamp(lsSub.attributes.renews_at),
              "subscription.pastDueSince": null,
            });
            if (ownerEmail && plan) {
              await sendEmail(() =>
                sendSubscriptionRenewedEmail({
                  to: ownerEmail,
                  planName: plan.name,
                  nextBillingDate: lsSub.attributes.renews_at ?? "—",
                })
              );
            }
          } else {
            await doc.ref.update({ "subscription.status": "past_due", "subscription.pastDueSince": Timestamp.now() });
            if (ownerEmail) {
              await sendEmail(() =>
                sendPaymentFailedEmail({
                  to: ownerEmail,
                  updatePaymentUrl: lsSub.attributes.urls.update_payment_method,
                })
              );
            }
          }
        } catch {
          // LemonSqueezy API unreachable — leave status as-is, the webhook or next day's sweep will catch it.
        }
      }

      if (sub.trialStatus === "active" && sub.lemonSqueezySubscriptionId && isToday(sub.trialEndDate)) {
        trialsChecked++;
        try {
          const lsSub = await getSubscription(sub.lemonSqueezySubscriptionId);
          const ownerEmail = await getOrgOwnerEmail(orgId);
          const plan = pricingPlans.find((p) => p.id === sub.planId);
          if (lsSub.attributes.status === "active") {
            await doc.ref.update({
              "subscription.trialStatus": "converted_to_paid",
              "subscription.currentPeriodStart": Timestamp.now(),
              "subscription.currentPeriodEnd": toTimestamp(lsSub.attributes.renews_at),
              "subscription.nextBillingDate": toTimestamp(lsSub.attributes.renews_at),
            });
            if (ownerEmail && plan) {
              await sendEmail(() => sendTrialConvertedEmail({ to: ownerEmail, planName: plan.name }));
            }
          } else {
            await doc.ref.update({ subscription: { ...freeSubscription(), trialStatus: "expired" } });
            if (ownerEmail) {
              await sendEmail(() => sendTrialEndedEmail({ to: ownerEmail }));
            }
          }
        } catch {
          // LemonSqueezy API unreachable — leave status as-is, caught on the next day's sweep.
        }
        continue;
      }

      if (sub.trialStatus === "active" && sub.trialEndDate) {
        const daysLeft = Math.round((sub.trialEndDate.toDate().getTime() - now.getTime()) / 86_400_000);
        if (daysLeft === 3 && canSendRenewalReminder(org)) {
          const ownerEmail = await getOrgOwnerEmail(orgId);
          const plan = pricingPlans.find((p) => p.id === sub.planId);
          if (ownerEmail && plan) {
            await sendEmail(() => sendTrialEndingEmail({ to: ownerEmail, orgId, planName: plan.name }));
            trialReminders++;
          }
        }
      }

      if (sub.status === "active" && sub.nextBillingDate && !sub.trialStatus) {
        const daysLeft = Math.round((sub.nextBillingDate.toDate().getTime() - now.getTime()) / 86_400_000);
        if (daysLeft === 3 && canSendRenewalReminder(org)) {
          const ownerEmail = await getOrgOwnerEmail(orgId);
          const plan = pricingPlans.find((p) => p.id === sub.planId);
          if (ownerEmail && plan) {
            const price = sub.billingInterval === "year" ? plan.priceYearly : plan.price;
            await sendEmail(() =>
              sendRenewalReminderEmail({
                to: ownerEmail,
                orgId,
                planName: plan.name,
                price: `€${price}`,
                renewsAt: sub.nextBillingDate!.toDate().toISOString().slice(0, 10),
                isExpertReviewPlan: planHasExpertReviewAccess(plan.id),
              })
            );
            renewalReminders++;
          }
        }
      }

      if (sub.status === "past_due" && sub.pastDueSince) {
        const daysPastDue = Math.floor((now.getTime() - sub.pastDueSince.toDate().getTime()) / 86_400_000);
        const ownerEmail = await getOrgOwnerEmail(orgId);
        if (daysPastDue >= 3) {
          await doc.ref.update({ subscription: freeSubscription() });
          await db.collection(firestorePaths.auditLog(orgId)).add({
            actorId: "billing-cron",
            action: "record_updated",
            targetCollection: "organizations",
            targetId: orgId,
            timestamp: FieldValue.serverTimestamp(),
            metadata: { subscriptionEvent: "past_due_downgrade_to_free" },
          });
          if (ownerEmail) {
            await sendEmail(() => sendSubscriptionDowngradedEmail({ to: ownerEmail }));
          }
          overdueDowngrades++;
        } else if (daysPastDue === 1) {
          if (ownerEmail) {
            await sendEmail(() =>
              sendPaymentOverdueEmail({
                to: ownerEmail,
                updatePaymentUrl: new URL("/billing", siteConfig.url).toString(),
              })
            );
          }
          overdueReminders++;
        }
      }
    }

    return {
      ok: true,
      ranAt: now.toISOString(),
      orgsScanned: orgsSnap.size,
      monthlyResets,
      downgrades,
      renewalsChecked,
      trialsChecked,
      trialReminders,
      renewalReminders,
      overdueReminders,
      overdueDowngrades,
    };
  });

  return NextResponse.json(result);
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
  );
}

function toTimestamp(iso: string | null): Timestamp | null {
  return iso ? Timestamp.fromDate(new Date(iso)) : null;
}
