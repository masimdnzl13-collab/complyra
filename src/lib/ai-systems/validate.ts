import type {
  AffectedGroup,
  AiDataType,
  AiSystemRole,
  BusinessArea,
  DecisionMakingRole,
} from "@/lib/firestore/schema";

export interface AiSystemInput {
  name: string;
  description: string;
  role: AiSystemRole;
  vendor: string;
  businessArea: BusinessArea;
  purpose: string;
  dataTypes: AiDataType[];
  affectedGroups: AffectedGroup[];
  decisionMakingRole: DecisionMakingRole;
  interactsWithPeople: boolean;
  generatesSyntheticContent: boolean;
  infersEmotionOrBehavior: boolean;
}

const ROLES = new Set<AiSystemRole>(["provider", "deployer"]);
const BUSINESS_AREAS = new Set<BusinessArea>([
  "hr",
  "customer_service",
  "marketing_content",
  "finance_credit",
  "product_feature",
  "operations",
  "other",
]);
const DATA_TYPES = new Set<AiDataType>([
  "personal",
  "sensitive_personal",
  "biometric",
  "customer",
  "employee",
  "anonymous_corporate",
]);
const AFFECTED_GROUPS = new Set<AffectedGroup>([
  "employees",
  "job_applicants",
  "customers",
  "children_vulnerable",
  "general_public",
]);
const DECISION_ROLES = new Set<DecisionMakingRole>(["info_only", "human_in_the_loop", "autonomous"]);

export function isValidAiSystemInput(body: unknown): body is AiSystemInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim().length === 0) return false;
  if (typeof b.description !== "string" || b.description.trim().length === 0) return false;
  if (typeof b.role !== "string" || !ROLES.has(b.role as AiSystemRole)) return false;
  if (typeof b.vendor !== "string" || b.vendor.trim().length === 0) return false;
  if (typeof b.businessArea !== "string" || !BUSINESS_AREAS.has(b.businessArea as BusinessArea)) return false;
  if (typeof b.purpose !== "string" || b.purpose.trim().length === 0) return false;
  if (!Array.isArray(b.dataTypes) || !b.dataTypes.every((d) => typeof d === "string" && DATA_TYPES.has(d as AiDataType))) {
    return false;
  }
  if (
    !Array.isArray(b.affectedGroups) ||
    !b.affectedGroups.every((g) => typeof g === "string" && AFFECTED_GROUPS.has(g as AffectedGroup))
  ) {
    return false;
  }
  if (typeof b.decisionMakingRole !== "string" || !DECISION_ROLES.has(b.decisionMakingRole as DecisionMakingRole)) {
    return false;
  }
  if (typeof b.interactsWithPeople !== "boolean") return false;
  if (typeof b.generatesSyntheticContent !== "boolean") return false;
  if (typeof b.infersEmotionOrBehavior !== "boolean") return false;

  return true;
}
