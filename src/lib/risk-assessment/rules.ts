import type { AiSystemDoc, AnnexIIICategory, DecisionPoint } from "@/lib/firestore/schema";

/**
 * Maps each Annex III high-risk decision point to its category. "public_benefits"
 * and "credit_insurance" both land on Annex III(5) ("access to essential private
 * and public services and benefits") — that's the real Annex III grouping, even
 * though the wizard asks about them as two separate, more concrete questions.
 */
export const DECISION_POINT_CATEGORY: Record<Exclude<DecisionPoint, "none">, AnnexIIICategory> = {
  hiring_evaluation: "employment",
  credit_insurance: "essential_services",
  education_exam: "education",
  law_enforcement: "law_enforcement",
  migration_border: "migration_border",
  public_benefits: "essential_services",
  judicial_decision: "justice_democratic",
};

export const ANNEX_III_REFERENCES: Record<AnnexIIICategory, string> = {
  biometrics: "Annex III(1)",
  employment: "Annex III(4)",
  education: "Annex III(3)",
  essential_services: "Annex III(5)",
  law_enforcement: "Annex III(6)",
  migration_border: "Annex III(7)",
  justice_democratic: "Annex III(8)",
};

export function getAnnexIIICategory(decisionPoint: DecisionPoint): AnnexIIICategory | null {
  if (decisionPoint === "none") return null;
  return DECISION_POINT_CATEGORY[decisionPoint];
}

/**
 * Article 5(1)(f) prohibits inferring emotions of natural persons in the
 * workplace (with narrow medical/safety exceptions this MVP rules engine
 * doesn't attempt to detect — a true positive here should stop the user,
 * not be second-guessed). Deliberately narrow: fires only on the clear
 * signal the inventory already captures (infers emotion/behavior + the
 * affected group includes employees), not on inference from looser signals.
 */
export function checkProhibitedPractice(
  system: AiSystemDoc
): { detected: boolean; reference: string | null } {
  if (system.infersEmotionOrBehavior && system.affectedGroups.includes("employees")) {
    return { detected: true, reference: "Article 5(1)(f)" };
  }
  return { detected: false, reference: null };
}

/**
 * Article 6(3) derogation: a system that falls in an Annex III high-risk
 * category is not classified high-risk if it only performs a narrow
 * procedural task that doesn't replace or materially influence human
 * decision-making. `decisionMakingRole === "info_only"` is this rules
 * engine's proxy for that — the system informs, a person decides.
 */
export function checkDerogation(decisionPoint: DecisionPoint, system: AiSystemDoc): boolean {
  const category = getAnnexIIICategory(decisionPoint);
  if (!category) return false;
  return system.decisionMakingRole === "info_only";
}
