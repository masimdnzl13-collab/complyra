import type { EmployeeCountRange } from "@/lib/firestore/schema";

export type EuRelationAnswer = "based" | "sells" | "neither";
export type AiRoleAnswer = "provider" | "deployer" | "both";

export type UseCase =
  | "hiring"
  | "credit_insurance"
  | "education"
  | "chatbot"
  | "content_generation"
  | "biometric"
  | "emotion_monitoring"
  | "none";

export interface ScanAnswers {
  euRelation: EuRelationAnswer;
  aiRole: AiRoleAnswer;
  useCases: UseCase[];
  vulnerableAudience: boolean;
  companySize: EmployeeCountRange;
}

export type FindingSeverity = "prohibited" | "high" | "transparency" | "info";

export interface Finding {
  id: string;
  title: string;
  severity: FindingSeverity;
  legalReference: string;
  /** ISO 8601 date the obligation takes effect. */
  effectiveDate: string;
  inForce: boolean;
  description: string;
  nextStep: string;
}

export interface ScanResult {
  earlyExit: boolean;
  earlyExitMessage?: string;
  profile?: { role: AiRoleAnswer };
  findings: Finding[];
  totalAreas: number;
  matchedAreas: number;
}
