import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ConsultantDoc, type ExpertReviewDoc, type PreferredTurnaround } from "@/lib/firestore/schema";
import { constructStripeEvent } from "@/lib/consultant/stripe-client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { claimWebhookEvent } from "@/lib/webhooks/dedup";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { sendPaymentConfirmedToConsultantEmail, sendReviewStartedToUserEmail } from "@/lib/email/send-expert-review-email";

const TURNAROUND_DAYS: Record<PreferredTurnaround, number> = { "24h": 1, "2d": 2, "1w": 7 };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`stripe-webhook:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, skipped: event.type });
  }

  // Stripe redelivers on any non-2xx/timeout, and event.id is stable across
  // redeliveries of the same event — the documented dedup key.
  const isNewEvent = await claimWebhookEvent("stripe", event.id);
  if (!isNewEvent) {
    return NextResponse.json({ ok: true, skipped: "duplicate delivery" });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const expertReviewId = session.metadata?.expertReviewId;
  if (!expertReviewId) {
    return NextResponse.json({ ok: true, skipped: "no expertReviewId in metadata" });
  }

  const db = getAdminFirestore();
  const reviewRef = db.doc(firestorePaths.expertReview(expertReviewId));
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) {
    return NextResponse.json({ error: "Unknown expert review" }, { status: 404 });
  }
  const review = reviewSnap.data() as ExpertReviewDoc;

  await reviewRef.update({
    status: "payment_received",
    stripeCheckoutSessionId: session.id,
    paymentReceivedAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.collection(firestorePaths.auditLog(review.organizationId)).add({
    actorId: "stripe-webhook",
    action: "payment_received",
    targetCollection: "expertReviews",
    targetId: expertReviewId,
    timestamp: FieldValue.serverTimestamp(),
  });

  const expectedCompletion = new Date(Date.now() + TURNAROUND_DAYS[review.preferredTurnaround] * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [ownerEmail, consultantSnap] = await Promise.all([
    getOrgOwnerEmail(review.organizationId),
    review.consultantId ? db.doc(firestorePaths.consultant(review.consultantId)).get() : Promise.resolve(null),
  ]);
  const consultant = consultantSnap?.data() as ConsultantDoc | undefined;

  if (ownerEmail) {
    await sendReviewStartedToUserEmail({ to: ownerEmail, expectedCompletion }).catch(() => {});
  }
  if (consultant) {
    await sendPaymentConfirmedToConsultantEmail({ to: consultant.email, caseId: expertReviewId }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
