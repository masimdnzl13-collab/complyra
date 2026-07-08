import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Per-instance, in-memory fixed-window limiter — resets on cold start and
 * isn't shared across function instances. That's a reasonable bar for
 * "makes abuse mildly annoying" on the free scanner endpoints; swap for a
 * shared store (e.g. Vercel Runtime Cache) if abuse actually shows up.
 */
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
