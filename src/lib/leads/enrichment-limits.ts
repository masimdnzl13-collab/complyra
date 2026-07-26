/**
 * Per-run caps for bulk enrichment actions — centralized so they're one
 * tunable number each, not scattered magic numbers inside route handlers.
 */
export const MAX_BULK_EMAIL_LOOKUPS_PER_RUN = 20;
export const MAX_BULK_SCORE_SCANS_PER_RUN = 20;
