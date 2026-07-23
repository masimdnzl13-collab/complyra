import "server-only";
import Stripe from "stripe";
import { siteConfig } from "@/config/site";

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  }
  return stripeClient;
}

interface CreateConsultationCheckoutParams {
  expertReviewId: string;
  consultantName: string;
  /** Whole-currency amount (EUR), not cents. */
  consultantFee: number;
  /** Whole-currency amount (EUR), not cents — Vermoncy's commission on top. */
  commission: number;
  userEmail: string;
}

/**
 * Dynamic per-case pricing (consultant fee + commission varies per proposal),
 * so this uses a Checkout Session rather than the static Payment Links API —
 * a Checkout Session is the Stripe primitive for a one-off, amount-at-creation-time
 * hosted payment page, which is what "create a payment link for this proposal"
 * means here.
 */
export async function createConsultationCheckoutSession({
  expertReviewId,
  consultantName,
  consultantFee,
  commission,
  userEmail,
}: CreateConsultationCheckoutParams): Promise<{ url: string }> {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(consultantFee * 100),
          product_data: { name: `Expert review — ${consultantName}` },
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(commission * 100),
          product_data: { name: `${siteConfig.name} platform fee` },
        },
        quantity: 1,
      },
    ],
    // Threaded back through the webhook payload to match the payment to an
    // expert_reviews doc — mirrors the LemonSqueezy custom_data pattern.
    metadata: { expertReviewId },
    success_url: new URL(`/expert-reviews?payment=success`, siteConfig.url).toString(),
    cancel_url: new URL(`/expert-reviews?payment=cancelled`, siteConfig.url).toString(),
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

/**
 * Verifies the raw webhook body against Stripe's signature — must run on
 * the untouched request text, same reasoning as the LemonSqueezy webhook.
 */
export function constructStripeEvent(rawBody: string, signature: string | null): Stripe.Event {
  if (!signature) throw new Error("Missing Stripe-Signature header");
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
