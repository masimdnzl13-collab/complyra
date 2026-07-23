import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { siteConfig } from "@/config/site";

const API_BASE = "https://api.lemonsqueezy.com/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
  };
}

async function lsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers(), ...init?.headers } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LemonSqueezy API error ${response.status}: ${body.slice(0, 500)}`);
  }
  return response.json() as Promise<T>;
}

interface CreateCheckoutParams {
  variantId: string;
  orgId: string;
  orgName: string;
  userEmail: string;
}

/** Returns the hosted checkout URL to redirect the user to. */
export async function createCheckoutUrl({ variantId, orgId, orgName, userEmail }: CreateCheckoutParams): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: userEmail,
          name: orgName,
          // Threaded back through the webhook payload so we can match the
          // resulting order/subscription to a Vermoncy organization without
          // relying on email matching.
          custom: { organization_id: orgId },
        },
        product_options: {
          // LemonSqueezy's hosted checkout only supports a success redirect —
          // there's no separate "error URL" the way Stripe has one. A failed
          // or abandoned payment stays on LemonSqueezy's own checkout page
          // for the customer to retry, rather than bouncing back here.
          redirect_url: new URL("/checkout/success", siteConfig.url).toString(),
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };

  const result = await lsFetch<{ data: { attributes: { url: string } } }>("/checkouts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return result.data.attributes.url;
}

export interface LemonSqueezySubscription {
  id: string;
  attributes: {
    status: string;
    renews_at: string | null;
    ends_at: string | null;
    trial_ends_at: string | null;
    card_brand: string | null;
    card_last_four: string | null;
    urls: { update_payment_method: string; customer_portal: string };
  };
}

export async function getSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
  const result = await lsFetch<{ data: LemonSqueezySubscription }>(`/subscriptions/${subscriptionId}`);
  return result.data;
}

/** Cancels at the end of the current billing period — LemonSqueezy's default DELETE behavior, not an immediate cutoff. */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await lsFetch(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}

export interface LemonSqueezyInvoice {
  id: string;
  attributes: {
    total_formatted: string;
    status: string;
    created_at: string;
    urls: { invoice_url: string };
  };
}

export async function listSubscriptionInvoices(subscriptionId: string): Promise<LemonSqueezyInvoice[]> {
  const result = await lsFetch<{ data: LemonSqueezyInvoice[] }>(
    `/subscription-invoices?filter[subscription_id]=${subscriptionId}&page[size]=12`
  );
  return result.data;
}

/**
 * LemonSqueezy signs every webhook with HMAC-SHA256 over the raw request
 * body, sent in the `X-Signature` header. Must run against the raw text —
 * JSON.parse/stringify round-tripping can reorder keys and break the MAC.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signatureHeader, "utf8");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
