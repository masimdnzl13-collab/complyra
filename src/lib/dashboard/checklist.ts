export type ChecklistSeverity = "urgent" | "warning" | "info";

export interface ChecklistItem {
  severity: ChecklistSeverity;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}

export interface ChecklistInputs {
  unassessedSystemsCount: number;
  prohibitedSystems: { id: string; name: string }[];
  borderlineAssessments: { id: string; systemId: string; systemName: string }[];
  undocumentedAssessmentsCount: number;
  article50MissingAreas: { label: string }[];
  incompleteTrainingCount: number;
  /** Total team members, used only to escalate the training item's severity below the 50%-completion mark. */
  totalTeamMembers: number;
}

/**
 * Ordered worst-first: a prohibited-practice finding is a legal red line,
 * not a backlog item, so it always sorts above ordinary to-dos regardless
 * of how many of those exist.
 */
export function buildComplianceChecklist(inputs: ChecklistInputs): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const system of inputs.prohibitedSystems) {
    items.push({
      severity: "urgent",
      title: `Prohibited practice detected: ${system.name}`,
      description: "This system was classified as a banned practice under Article 5. Stop this use case and seek legal advice.",
      actionLabel: "Review and stop use",
      href: `/ai-systems/${system.id}`,
    });
  }

  for (const assessment of inputs.borderlineAssessments) {
    items.push({
      severity: "warning",
      title: `Expert review recommended: ${assessment.systemName}`,
      description: "This risk classification was flagged as a borderline case by the assessment engine.",
      actionLabel: "Request expert review",
      href: `/ai-systems/${assessment.systemId}`,
    });
  }

  if (inputs.unassessedSystemsCount > 0) {
    items.push({
      severity: "warning",
      title: `${inputs.unassessedSystemsCount} AI system${inputs.unassessedSystemsCount === 1 ? "" : "s"} not yet assessed`,
      description: "Every system in your inventory needs a risk classification.",
      actionLabel: "Assess systems",
      href: "/assessments",
    });
  }

  if (inputs.undocumentedAssessmentsCount > 0) {
    items.push({
      severity: "warning",
      title: `${inputs.undocumentedAssessmentsCount} assessment${inputs.undocumentedAssessmentsCount === 1 ? "" : "s"} without documents`,
      description: "Generate the compliance documents these risk classifications require.",
      actionLabel: "Generate documents",
      href: "/documents/new",
    });
  }

  for (const area of inputs.article50MissingAreas) {
    items.push({
      severity: "info",
      title: `Article 50: ${area.label} needs attention`,
      description: "Prepare the transparency materials this area of Article 50 requires.",
      actionLabel: "Prepare disclosures",
      href: "/article-50",
    });
  }

  if (inputs.incompleteTrainingCount > 0) {
    // Below 50% completion is a genuine compliance risk, not just a backlog item — escalate accordingly.
    const completionRate =
      inputs.totalTeamMembers === 0 ? 1 : (inputs.totalTeamMembers - inputs.incompleteTrainingCount) / inputs.totalTeamMembers;
    items.push({
      severity: completionRate < 0.5 ? "warning" : "info",
      title: `${inputs.incompleteTrainingCount} employee${inputs.incompleteTrainingCount === 1 ? "" : "s"} haven't completed AI Literacy training`,
      description: "Article 4 requires staff to have a sufficient level of AI literacy.",
      actionLabel: "View training report",
      href: "/ai-literacy/reports",
    });
  }

  return items;
}
