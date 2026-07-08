/**
 * Compliance score weights — central config so the formula can be tuned in
 * one place later without touching the dashboard's data-fetching code.
 */
export const SCORE_WEIGHTS = {
  systemsAssessed: 30,
  assessmentsDocumented: 25,
  aiLiteracy: 20,
  article50Readiness: 15,
  /** Every sensitive write in this app already goes through the Admin SDK + audit log by construction — this factor is a flat credit, not computed from a ratio. */
  auditTrail: 10,
} as const;

export interface ScoreInputs {
  totalSystems: number;
  assessedSystems: number;
  /** Active assessments excluding prohibited-practice ones — those can never get a document, so they're excluded from this ratio's denominator. */
  documentableAssessments: number;
  documentedAssessments: number;
  totalTeamMembers: number;
  completedTraining: number;
  article50ReadyAreas: number;
  article50TotalAreas: number;
}

export interface ScoreFactor {
  key: keyof typeof SCORE_WEIGHTS;
  label: string;
  points: number;
  maxPoints: number;
}

export interface ScoreResult {
  score: number;
  factors: ScoreFactor[];
}

function ratioPoints(numerator: number, denominator: number, weight: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * weight);
}

export function calculateComplianceScore(inputs: ScoreInputs): ScoreResult {
  const factors: ScoreFactor[] = [
    {
      key: "systemsAssessed",
      label: "AI systems assessed",
      points: ratioPoints(inputs.assessedSystems, inputs.totalSystems, SCORE_WEIGHTS.systemsAssessed),
      maxPoints: SCORE_WEIGHTS.systemsAssessed,
    },
    {
      key: "assessmentsDocumented",
      label: "Assessments documented",
      points: ratioPoints(inputs.documentedAssessments, inputs.documentableAssessments, SCORE_WEIGHTS.assessmentsDocumented),
      maxPoints: SCORE_WEIGHTS.assessmentsDocumented,
    },
    {
      key: "aiLiteracy",
      label: "AI literacy training",
      points: ratioPoints(inputs.completedTraining, inputs.totalTeamMembers, SCORE_WEIGHTS.aiLiteracy),
      maxPoints: SCORE_WEIGHTS.aiLiteracy,
    },
    {
      key: "article50Readiness",
      label: "Article 50 readiness",
      points: ratioPoints(inputs.article50ReadyAreas, inputs.article50TotalAreas, SCORE_WEIGHTS.article50Readiness),
      maxPoints: SCORE_WEIGHTS.article50Readiness,
    },
    {
      key: "auditTrail",
      label: "Audit trail completeness",
      points: SCORE_WEIGHTS.auditTrail,
      maxPoints: SCORE_WEIGHTS.auditTrail,
    },
  ];

  const score = factors.reduce((sum, f) => sum + f.points, 0);
  return { score, factors };
}

export interface Opportunity {
  description: string;
  pointsGain: number;
  href: string;
}

/** Ranked, highest point-gain first — the score explanation only ever shows the top few. */
export function getScoreOpportunities(inputs: ScoreInputs): Opportunity[] {
  const opportunities: Opportunity[] = [];

  const unassessedSystems = inputs.totalSystems - inputs.assessedSystems;
  if (unassessedSystems > 0) {
    const gain = SCORE_WEIGHTS.systemsAssessed - ratioPoints(inputs.assessedSystems, inputs.totalSystems, SCORE_WEIGHTS.systemsAssessed);
    opportunities.push({
      description: `complete assessments for ${unassessedSystems} remaining system${unassessedSystems === 1 ? "" : "s"}`,
      pointsGain: gain,
      href: "/assessments",
    });
  }

  const undocumented = inputs.documentableAssessments - inputs.documentedAssessments;
  if (undocumented > 0) {
    const gain =
      SCORE_WEIGHTS.assessmentsDocumented -
      ratioPoints(inputs.documentedAssessments, inputs.documentableAssessments, SCORE_WEIGHTS.assessmentsDocumented);
    opportunities.push({
      description: `generate documents for ${undocumented} assessed system${undocumented === 1 ? "" : "s"}`,
      pointsGain: gain,
      href: "/documents/new",
    });
  }

  const untrained = inputs.totalTeamMembers - inputs.completedTraining;
  if (untrained > 0) {
    const gain = SCORE_WEIGHTS.aiLiteracy - ratioPoints(inputs.completedTraining, inputs.totalTeamMembers, SCORE_WEIGHTS.aiLiteracy);
    opportunities.push({
      description: `get ${untrained} more team member${untrained === 1 ? "" : "s"} through AI literacy training`,
      pointsGain: gain,
      href: "/ai-literacy/reports",
    });
  }

  const missingArticle50 = inputs.article50TotalAreas - inputs.article50ReadyAreas;
  if (missingArticle50 > 0) {
    const gain =
      SCORE_WEIGHTS.article50Readiness -
      ratioPoints(inputs.article50ReadyAreas, inputs.article50TotalAreas, SCORE_WEIGHTS.article50Readiness);
    opportunities.push({
      description: `prepare Article 50 materials for ${missingArticle50} remaining area${missingArticle50 === 1 ? "" : "s"}`,
      pointsGain: gain,
      href: "/article-50",
    });
  }

  return opportunities.sort((a, b) => b.pointsGain - a.pointsGain);
}
