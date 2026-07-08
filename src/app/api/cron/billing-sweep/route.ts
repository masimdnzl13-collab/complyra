import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans } from "@/config/site";
import { getCurrentMonthKey } from "@/lib/usage/monthly-quota";
import { freeSubscription } from "@/lib/billing/subscription-defaults";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { sendRenewalReminderEmail, sendTrialEndingEmail } from "@/lib/email/send-billing-email";

/**
 * Runs daily (see vercel.json). Three jobs, all belt-and-suspenders for
 * things the webhook handler / lazy monthly-quota check should already
 * cover, plus the two time-based reminder emails that have no webhook
 * event to hang off of:
 *  1. Reset any org whose usageMonthKey has gone stale (normally caught
 *     lazily on the next quota check, but this keeps counters from
 *     sitting stale indefinitely on quiet orgs).
 *  2. Downgrade cancelled subscriptions whose currentPeriodEnd has passed
 *     to Free — a safety net for a missed/failed `subscription_expired`
 *     webhook delivery.
 *  3. Send trial-ending and renewal reminder emails exactly 3 days out.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const now = new Date();
  const currentMonthKey = getCurrentMonthKey(now);
  const nowTs = Timestamp.fromDate(now);

  const orgsSnap = await db.collection(firestorePaths.organizations()).get();

  let monthlyResets = 0;
  let downgrades = 0;
  let trialReminders = 0;
  let renewalReminders = 0;

  for (const doc of orgsSnap.docs) {
    const org = doc.data() as OrganizationDoc;
    const orgId = doc.id;

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

    if (
      org.subscription.status === "cancelled" &&
      org.subscription.currentPeriodEnd &&
      org.subscription.currentPeriodEnd.toDate() <= now
    ) {
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

    if (org.subscription.trialStatus === "active" && org.subscription.trialEndDate) {
      const daysLeft = Math.round((org.subscription.trialEndDate.toDate().getTime() - now.getTime()) / 86_400_000);
      if (daysLeft === 3) {
        const ownerEmail = await getOrgOwnerEmail(orgId);
        const plan = pricingPlans.find((p) => p.id === org.subscription.planId);
        if (ownerEmail && plan) {
          await sendTrialEndingEmail({ to: ownerEmail, planName: plan.name }).catch(() => {});
          trialReminders++;
        }
      }
    }

    if (org.subscription.status === "active" && org.subscription.nextBillingDate && !org.subscription.trialStatus) {
      const daysLeft = Math.round((org.subscription.nextBillingDate.toDate().getTime() - now.getTime()) / 86_400_000);
      if (daysLeft === 3) {
        const ownerEmail = await getOrgOwnerEmail(orgId);
        const plan = pricingPlans.find((p) => p.id === org.subscription.planId);
        if (ownerEmail && plan) {
          const price = org.subscription.billingInterval === "year" ? plan.priceYearly : plan.price;
          await sendRenewalReminderEmail({
            to: ownerEmail,
            planName: plan.name,
            price: `€${price}`,
            renewsAt: org.subscription.nextBillingDate.toDate().toISOString().slice(0, 10),
          }).catch(() => {});
          renewalReminders++;
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    ranAt: nowTs.toDate().toISOString(),
    orgsScanned: orgsSnap.size,
    monthlyResets,
    downgrades,
    trialReminders,
    renewalReminders,
  });
}
