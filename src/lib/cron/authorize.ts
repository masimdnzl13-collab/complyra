import "server-only";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export interface CronAuthResult {
  ok: boolean;
  triggeredBy: "schedule" | "manual";
}

/**
 * Every cron route accepts either the scheduler's CRON_SECRET bearer token
 * (Vercel Cron / an external scheduler) or a signed-in platform_admin
 * session (the admin dashboard's "run now" buttons) — same job, two ways
 * to fire it, distinguished in the CronRunDoc's `triggeredBy` field.
 */
export async function authorizeCronRequest(request: NextRequest): Promise<CronAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return { ok: true, triggeredBy: "schedule" };
  }

  const user = await getCurrentUser();
  if (user?.userDoc?.role === "platform_admin") {
    return { ok: true, triggeredBy: "manual" };
  }

  return { ok: false, triggeredBy: "manual" };
}
