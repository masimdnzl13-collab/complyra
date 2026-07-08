import "server-only";

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
  ];

  return Promise.all(checks);
}
