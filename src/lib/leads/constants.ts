/**
 * AI-usage score bands for the Lead Discovery dashboard. Centralized here
 * (not hardcoded inline) so the badge coloring and the future scoring
 * engine's "high priority" cutoff can never drift apart.
 */
export const LEAD_SCORE_HIGH_THRESHOLD = 70;
export const LEAD_SCORE_MEDIUM_THRESHOLD = 40;

export type LeadScoreBand = "high" | "medium" | "low" | "unscored";

export function leadScoreBand(score: number | null): LeadScoreBand {
  if (score === null) return "unscored";
  if (score >= LEAD_SCORE_HIGH_THRESHOLD) return "high";
  if (score >= LEAD_SCORE_MEDIUM_THRESHOLD) return "medium";
  return "low";
}
