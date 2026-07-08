import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { siteConfig } from "@/config/site";

export type OrgEmailCategory = "deadlineReminders" | "renewalReminders" | "regulatoryNews" | "all";

/**
 * Unsubscribe links must work from a cold click in an email client with no
 * session — there's no login to check, so the link itself carries a signed
 * token instead. Low-stakes payload (worst case: someone unsubscribes an
 * org they don't own from marketing email), so HMAC-SHA256 keyed off
 * CRON_SECRET is enough; it doesn't warrant its own dedicated secret.
 */
function sign(payload: string): string {
  return createHmac("sha256", process.env.CRON_SECRET ?? "").update(payload).digest("hex");
}

function verify(payload: string, token: string): boolean {
  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(token, "utf8");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function buildOrgUnsubscribeUrl(orgId: string, category: OrgEmailCategory): string {
  const payload = `org:${orgId}:${category}`;
  const url = new URL("/unsubscribe", siteConfig.url);
  url.searchParams.set("org", orgId);
  url.searchParams.set("category", category);
  url.searchParams.set("token", sign(payload));
  return url.toString();
}

export function verifyOrgUnsubscribeToken(orgId: string, category: string, token: string): boolean {
  return verify(`org:${orgId}:${category}`, token);
}

export function buildNewsletterUnsubscribeUrl(email: string): string {
  const payload = `newsletter:${email.toLowerCase()}`;
  const url = new URL("/unsubscribe", siteConfig.url);
  url.searchParams.set("email", email.toLowerCase());
  url.searchParams.set("token", sign(payload));
  return url.toString();
}

export function verifyNewsletterUnsubscribeToken(email: string, token: string): boolean {
  return verify(`newsletter:${email.toLowerCase()}`, token);
}
