/**
 * "YYYY-MM" in UTC. Compared against `OrganizationUsage.usageMonthKey` to
 * lazily reset monthly counters — there is no cron job; a stale key is
 * detected and zeroed out as a side effect of the next quota check.
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
