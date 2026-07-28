import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getHunterAccountStatus } from "@/lib/leads/hunter";

export interface ApiHealthStatus {
  name: string;
  ok: boolean;
  detail: string;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

/** Lightweight, read-only reachability checks — not a full status API, just "did a cheap authenticated call succeed just now." */
export async function checkApiHealth(): Promise<ApiHealthStatus[]> {
  const checks: Promise<ApiHealthStatus>[] = [
    (async () => {
      try {
        const res = await withTimeout(
          fetch(`https://api.lemonsqueezy.com/v1/stores/${process.env.LEMONSQUEEZY_STORE_ID}`, {
            headers: { Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`, Accept: "application/vnd.api+json" },
          }),
          5000
        );
        return { name: "LemonSqueezy", ok: res.ok, detail: res.ok ? "Reachable" : `HTTP ${res.status}` };
      } catch (err) {
        return { name: "LemonSqueezy", ok: false, detail: err instanceof Error ? err.message : "Unreachable" };
      }
    })(),
    (async () => {
      try {
        const res = await withTimeout(
          fetch("https://api.stripe.com/v1/balance", {
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          }),
          5000
        );
        return { name: "Stripe", ok: res.ok, detail: res.ok ? "Reachable" : `HTTP ${res.status}` };
      } catch (err) {
        return { name: "Stripe", ok: false, detail: err instanceof Error ? err.message : "Unreachable" };
      }
    })(),
    (async () => {
      const hasKey = !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your-resend-api-key";
      return { name: "Resend", ok: hasKey, detail: hasKey ? "API key configured" : "No API key configured" };
    })(),
    (async () => {
      const status = await getHunterAccountStatus();
      if (!status) return { name: "Hunter.io", ok: false, detail: "Unreachable or no API key configured" };
      return { name: "Hunter.io", ok: status.available > 0, detail: `${status.available} searches left this cycle` };
    })(),
    (async () => {
      const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key";
      if (!hasKey) return { name: "Claude API", ok: false, detail: "No API key configured" };
      try {
        // A real, minimal Messages call — not just a models.retrieve() lookup —
        // because credit-balance and billing failures only surface on an
        // actual inference request, which is exactly what discover-leads and
        // regulatory-news depend on.
        await withTimeout(
          new Anthropic().messages.create({
            model: "claude-opus-4-8",
            max_tokens: 1,
            messages: [{ role: "user", content: "OK" }],
          }),
          8000
        );
        return { name: "Claude API", ok: true, detail: "Reachable" };
      } catch (err) {
        const detail = err instanceof Anthropic.APIError ? err.message : err instanceof Error ? err.message : "Unreachable";
        return { name: "Claude API", ok: false, detail };
      }
    })(),
  ];

  return Promise.all(checks);
}
