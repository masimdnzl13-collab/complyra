import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { siteConfig } from "@/config/site";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc, type SubscriptionStatus } from "@/lib/firestore/schema";
import { verifyWebhookSignature } from "@/lib/billing/lemonsqueezy-client";
import { findPlanByVariantId } from "@/lib/billing/plan-lookup";
import { freeSubscription } from "@/lib/billing/subscription-defaults";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  sendCancellationConfirmationEmail,
  sendPaymentFailedEmail,
  sendWelcomeToPaidPlanEmail,
} from "@/lib/email/send-billing-email";

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: { organization_id?: string };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      customer_id: number;
      variant_id: number;
      card_brand: string | null;
      card_last_four: string | null;
      trial_ends_at: string | null;
      renews_at: string | null;
      ends_at: string | null;
      created_at: string;
      urls?: { update_payment_method?: string };
    };
  };
}

const LS_STATUS_MAP: Record<string, SubscriptionStatus> = {
  on_trial: "trialing",
  active: "active",
  past_due: "past_due",
  unpaid: "past_due",
  paused: "cancelled",
  cancelled: "cancelled",
  expired: "cancelled",
};

function toTimestamp(iso: string | null): Timestamp | null {
  return iso ? Timestamp.fromDate(new Date(iso)) : null;
}

async function logSubscriptionEvent(orgId: string, eventName: string, metadata: Record<string, unknown>) {
  const db = getAdminFirestore();
  await db.collection(firestorePaths.auditLog(orgId)).add({
    actorId: "lemonsqueezy-webhook",
    action: "record_updated",
    targetCollection: "organizations",
    targetId: orgId,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { subscriptionEvent: eventName, ...metadata },
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`lemonsqueezy-webhook:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload;
  const eventName = payload.meta.event_name;
  const orgId = payload.meta.custom_data?.organization_id;

  if (!orgId) {
    // Non-subscription events (e.g. a test ping) may carry no custom data — acknowledge, nothing to update.
    return NextResponse.json({ ok: true, skipped: "no organization_id in custom_data" });
  }

  const db = getAdminFirestore();
  const orgRef = db.doc(firestorePaths.organization(orgId));
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    return NextResponse.json({ error: "Unknown organization" }, { status: 404 });
  }
  const organization = orgSnap.data() as OrganizationDoc;
  const attrs = payload.data.attributes;

  switch (eventName) {
    case "order_created":
    case "subscription_created": {
      const match = findPlanByVariantId(attrs.variant_id);
      const status = LS_STATUS_MAP[attrs.status] ?? "active";
      await orgRef.update({
        "subscription.planId": match?.plan.id ?? organization.subscription.planId,
        "subscription.status": status,
        "subscription.billingInterval": match?.interval ?? organization.subscription.billingInterval,
        "subscription.lemonSqueezyCustomerId": String(attrs.customer_id),
        "subscription.lemonSqueezySubscriptionId": payload.data.id,
        "subscription.currentPeriodStart": toTimestamp(attrs.created_at),
        "subscription.currentPeriodEnd": toTimestamp(attrs.renews_at),
        "subscription.nextBillingDate": toTimestamp(attrs.renews_at),
        "subscription.cardBrand": attrs.card_brand,
        "subscription.cardLastFour": attrs.card_last_four,
        "subscription.trialEndDate": toTimestamp(attrs.trial_ends_at),
        "subscription.trialStatus": attrs.trial_ends_at ? "active" : null,
      });
      await logSubscriptionEvent(orgId, eventName, { planId: match?.plan.id, status });
      if (match) {
        const ownerEmail = await getOrgOwnerEmail(orgId);
        if (ownerEmail) {
          await sendWelcomeToPaidPlanEmail({
            to: ownerEmail,
            planName: match.plan.name,
            nextBillingDate: attrs.renews_at ?? "—",
          }).catch(() => {});
        }
      }
      break;
    }

    case "subscription_updated":
    case "subscription_plan_changed": {
      const match = findPlanByVariantId(attrs.variant_id);
      const status = LS_STATUS_MAP[attrs.status] ?? organization.subscription.status;
      await orgRef.update({
        "subscription.planId": match?.plan.id ?? organization.subscription.planId,
        "subscription.status": status,
        "subscription.billingInterval": match?.interval ?? organization.subscription.billingInterval,
        "subscription.currentPeriodEnd": toTimestamp(attrs.renews_at ?? attrs.ends_at),
        "subscription.nextBillingDate": toTimestamp(attrs.renews_at),
        "subscription.cardBrand": attrs.card_brand,
        "subscription.cardLastFour": attrs.card_last_four,
        "subscription.trialStatus":
          attrs.status === "active" && organization.subscription.trialStatus === "active"
            ? "converted_to_paid"
            : organization.subscription.trialStatus,
        "subscription.pastDueSince": status === "active" ? null : organization.subscription.pastDueSince,
      });
      await logSubscriptionEvent(orgId, eventName, { planId: match?.plan.id, status });
      break;
    }

    case "subscription_cancelled": {
      // Access continues until currentPeriodEnd — the plan doesn't change here,
      // only the status. The monthly cron (or subscription_expired) does the
      // actual downgrade-to-Free once the paid period truly ends.
      await orgRef.update({
        "subscription.status": "cancelled" satisfies SubscriptionStatus,
        "subscription.currentPeriodEnd": toTimestamp(attrs.ends_at),
      });
      await logSubscriptionEvent(orgId, eventName, {});
      const cancelOwnerEmail = await getOrgOwnerEmail(orgId);
      if (cancelOwnerEmail) {
        await sendCancellationConfirmationEmail({ to: cancelOwnerEmail }).catch(() => {});
      }
      break;
    }

    case "subscription_expired": {
      await orgRef.update({ subscription: freeSubscription() });
      await logSubscriptionEvent(orgId, eventName, { downgradedTo: "free" });
      break;
    }

    case "subscription_payment_failed": {
      await orgRef.update({
        "subscription.status": "past_due" satisfies SubscriptionStatus,
        "subscription.pastDueSince": FieldValue.serverTimestamp(),
      });
      await logSubscriptionEvent(orgId, eventName, {});
      const failedOwnerEmail = await getOrgOwnerEmail(orgId);
      if (failedOwnerEmail) {
        await sendPaymentFailedEmail({
          to: failedOwnerEmail,
          updatePaymentUrl: attrs.urls?.update_payment_method ?? new URL("/billing", siteConfig.url).toString(),
        }).catch(() => {});
      }
      break;
    }

    case "subscription_payment_success":
    case "subscription_payment_recovered": {
      await orgRef.update({
        "subscription.status": "active" satisfies SubscriptionStatus,
        "subscription.currentPeriodEnd": toTimestamp(attrs.renews_at),
        "subscription.nextBillingDate": toTimestamp(attrs.renews_at),
        "subscription.pastDueSince": null,
      });
      await logSubscriptionEvent(orgId, eventName, {});
      break;
    }

    default:
      // Acknowledge unhandled event types rather than erroring — LemonSqueezy retries on non-2xx.
      break;
  }

  return NextResponse.json({ ok: true });
}
