import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type CronJobName } from "@/lib/firestore/schema";

export interface CronRunCounters {
  processedCount: number;
  emailsSent: number;
  emailsFailed: number;
}

/**
 * Wraps a cron job body with start/finish timing and a CronRunDoc record —
 * this doc is both the admin "Cron Job History" table and the audit trail
 * for background jobs (see the comment on CronRunDoc in schema.ts).
 */
export async function withCronRunLogging<T extends Record<string, unknown>>(
  jobName: CronJobName,
  triggeredBy: "schedule" | "manual",
  run: (counters: CronRunCounters) => Promise<T>
): Promise<T & { durationMs: number }> {
  const db = getAdminFirestore();
  const startedAt = Timestamp.now();
  const startMs = Date.now();
  const counters: CronRunCounters = { processedCount: 0, emailsSent: 0, emailsFailed: 0 };

  try {
    const result = await run(counters);
    const durationMs = Date.now() - startMs;
    await db.collection(firestorePaths.cronRuns()).add({
      jobName,
      status: "success",
      startedAt,
      finishedAt: Timestamp.now(),
      durationMs,
      processedCount: counters.processedCount,
      emailsSent: counters.emailsSent,
      emailsFailed: counters.emailsFailed,
      errorMessage: null,
      triggeredBy,
    });
    return { ...result, durationMs };
  } catch (err) {
    const durationMs = Date.now() - startMs;
    await db.collection(firestorePaths.cronRuns()).add({
      jobName,
      status: "failed",
      startedAt,
      finishedAt: Timestamp.now(),
      durationMs,
      processedCount: counters.processedCount,
      emailsSent: counters.emailsSent,
      emailsFailed: counters.emailsFailed,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
      triggeredBy,
    });
    throw err;
  }
}
