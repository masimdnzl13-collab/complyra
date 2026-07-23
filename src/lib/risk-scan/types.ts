import { z } from "zod";
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

const FindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["prohibited", "high", "transparency", "info"]),
  legalReference: z.string(),
  effectiveDate: z.string(),
  inForce: z.boolean(),
  description: z.string(),
  nextStep: z.string(),
}) satisfies z.ZodType<Finding>;

/** Validates `LeadDoc.result` before it's rendered on the public /report/[id] page. */
export const ScanResultSchema = z.object({
  earlyExit: z.boolean(),
  earlyExitMessage: z.string().optional(),
  profile: z.object({ role: z.enum(["provider", "deployer", "both"]) }).optional(),
  findings: z.array(FindingSchema),
  totalAreas: z.number(),
  matchedAreas: z.number(),
}) satisfies z.ZodType<ScanResult>;
