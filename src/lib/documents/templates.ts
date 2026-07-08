import type {
  AiSystemRole,
  AssessmentDoc,
  ComplianceDocumentType,
  DecisionPoint,
} from "@/lib/firestore/schema";

export interface SectionTemplate {
  id: string;
  title: string;
  /** One-line instruction for what this section should contain — fed to Claude. */
  guidance: string;
}

export interface DocumentTemplate {
  type: ComplianceDocumentType;
  label: string;
  description: string;
  sections: SectionTemplate[];
}

export const DOCUMENT_TEMPLATES: Record<ComplianceDocumentType, DocumentTemplate> = {
  ai_use_policy: {
    type: "ai_use_policy",
    label: "AI Use Policy",
    description: "The company's internal policy for this AI system, in plain terms.",
    sections: [
      { id: "purpose_and_scope", title: "Purpose & Scope", guidance: "What this policy covers and why it exists for this system." },
      { id: "acceptable_use", title: "Acceptable Use", guidance: "What the system may and may not be used for." },
      { id: "roles_and_responsibilities", title: "Roles & Responsibilities", guidance: "Who owns, operates, and oversees this system." },
      { id: "risk_and_compliance_commitments", title: "Risk & Compliance Commitments", guidance: "The obligations this system is subject to and how the company meets them." },
    ],
  },
  risk_assessment_report: {
    type: "risk_assessment_report",
    label: "Risk Assessment Report",
    description: "The detailed version of the risk classification, with legal basis and roadmap.",
    sections: [
      { id: "executive_summary", title: "Executive Summary", guidance: "One paragraph summarizing the risk classification and its basis." },
      { id: "regulatory_scope", title: "Regulatory Scope", guidance: "Which EU AI Act articles and Annex III categories apply and why." },
      { id: "system_description", title: "System Description", guidance: "A clear description of what the system does, restated from its inventory record." },
      { id: "risk_analysis_by_category", title: "Risk Analysis by Category", guidance: "How the system's use case maps against each relevant Annex III category, including ones that do NOT apply and why." },
      { id: "compliance_roadmap", title: "Compliance Roadmap", guidance: "Concrete next steps and their deadlines, based on the applicable obligations." },
    ],
  },
  human_oversight_procedure: {
    type: "human_oversight_procedure",
    label: "Human Oversight Procedure",
    description: "Defines the human role, authority, and level of oversight over this system.",
    sections: [
      { id: "oversight_role_and_authority", title: "Oversight Role & Authority", guidance: "Who is responsible for overseeing this system and what authority they have." },
      { id: "monitoring_procedure", title: "Monitoring Procedure", guidance: "How the system's operation and outputs are monitored." },
      { id: "intervention_and_override", title: "Intervention & Override", guidance: "How and when a human can intervene in or override the system's output." },
      { id: "escalation_path", title: "Escalation Path", guidance: "Who to escalate to if the system behaves unexpectedly." },
    ],
  },
  vendor_assessment: {
    type: "vendor_assessment",
    label: "Vendor Assessment",
    description: "Records that the third-party vendor's compliance documentation was reviewed.",
    sections: [
      { id: "vendor_overview", title: "Vendor Overview", guidance: "The vendor and product being assessed." },
      { id: "compliance_documentation_reviewed", title: "Compliance Documentation Reviewed", guidance: "What documentation from the vendor was reviewed (or should be requested)." },
      { id: "findings", title: "Findings", guidance: "What the review found about the vendor's compliance posture." },
      { id: "residual_risk_and_recommendations", title: "Residual Risk & Recommendations", guidance: "Remaining risk from relying on this vendor and recommended mitigations." },
    ],
  },
  fria: {
    type: "fria",
    label: "Fundamental Rights Impact Assessment",
    description: "Required for public bodies (and certain private operators) deploying high-risk AI in public-facing categories.",
    sections: [
      { id: "fundamental_rights_at_stake", title: "Fundamental Rights at Stake", guidance: "Which fundamental rights this system's use case could affect." },
      { id: "affected_persons_and_groups", title: "Affected Persons & Groups", guidance: "Who is affected by this system's decisions, including vulnerable groups." },
      { id: "risk_mitigation_measures", title: "Risk Mitigation Measures", guidance: "Measures in place or planned to mitigate the identified risks to fundamental rights." },
      { id: "consultation_and_safeguards", title: "Consultation & Safeguards", guidance: "Consultation undertaken and safeguards for affected persons, including complaint/redress routes." },
    ],
  },
};

/**
 * Article 27 of the EU AI Act requires a FRIA from public bodies (and
 * certain public-service operators) deploying high-risk AI. The inventory
 * doesn't yet capture "is this organization a public body" as its own
 * field, so this uses the assessment's decision point as a proxy — these
 * four map to inherently public-sector Annex III categories (law
 * enforcement, migration/border, justice, and public benefits).
 */
const PUBLIC_SECTOR_DECISION_POINTS = new Set<DecisionPoint>([
  "law_enforcement",
  "migration_border",
  "judicial_decision",
  "public_benefits",
]);

export interface DocumentSuggestion {
  type: ComplianceDocumentType;
  reason: string;
}

export function suggestDocumentTypes(assessment: AssessmentDoc, systemRole: AiSystemRole): DocumentSuggestion[] {
  const suggestions: DocumentSuggestion[] = [];

  if (assessment.riskTier === "high") {
    suggestions.push({ type: "risk_assessment_report", reason: "Required for high-risk systems" });
    suggestions.push({ type: "human_oversight_procedure", reason: "Required for high-risk systems" });
    if (systemRole === "deployer") {
      suggestions.push({ type: "vendor_assessment", reason: "Third-party system — document the vendor review" });
    }
  }

  if (assessment.riskTier === "high" && PUBLIC_SECTOR_DECISION_POINTS.has(assessment.decisionPoint)) {
    suggestions.push({ type: "fria", reason: "Public-sector high-risk use case (Article 27)" });
  }

  return suggestions;
}
