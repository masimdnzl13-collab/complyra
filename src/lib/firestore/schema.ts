import type { PlanId } from "@/config/site";

/**
 * Single source of truth for every Firestore collection name, document
 * path, and document shape in Complyra. Nothing in this codebase should
 * spell out a collection name as a string literal elsewhere — read it from
 * `COLLECTIONS` or build the path with `firestorePaths`, so this module can
 * be lifted into other projects unchanged.
 *
 * Data model:
 *   organizations/{orgId}
 *     users/{uid}                      (top-level, references organizationId)
 *     organizations/{orgId}/aiSystems/{systemId}
 *     organizations/{orgId}/assessments/{assessmentId}   (references aiSystemId)
 *     organizations/{orgId}/documents/{documentId}        (references assessmentId)
 *     organizations/{orgId}/trainingRecords/{recordId}
 *     organizations/{orgId}/auditLog/{entryId}            (append-only, server-write-only)
 *     organizations/{orgId}/invites/{inviteId}            (server-write-only, looked up by token)
 */

export const COLLECTIONS = {
  organizations: "organizations",
  users: "users",
  aiSystems: "aiSystems",
  assessments: "assessments",
  documents: "documents",
  trainingRecords: "trainingRecords",
  auditLog: "auditLog",
  invites: "invites",
} as const;

export const firestorePaths = {
  organizations: () => COLLECTIONS.organizations,
  organization: (orgId: string) => `${COLLECTIONS.organizations}/${orgId}`,

  users: () => COLLECTIONS.users,
  user: (uid: string) => `${COLLECTIONS.users}/${uid}`,

  aiSystems: (orgId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.aiSystems}`,
  aiSystem: (orgId: string, systemId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.aiSystems}/${systemId}`,

  assessments: (orgId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.assessments}`,
  assessment: (orgId: string, assessmentId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.assessments}/${assessmentId}`,

  documents: (orgId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.documents}`,
  document: (orgId: string, documentId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.documents}/${documentId}`,

  trainingRecords: (orgId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.trainingRecords}`,
  trainingRecord: (orgId: string, recordId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.trainingRecords}/${recordId}`,

  auditLog: (orgId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.auditLog}`,
  auditLogEntry: (orgId: string, entryId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.auditLog}/${entryId}`,

  invites: (orgId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.invites}`,
  invite: (orgId: string, inviteId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.invites}/${inviteId}`,
} as const;

/** Structural Firestore timestamp shape — matches both the client SDK's
 * and Admin SDK's Timestamp class without depending on either at the type
 * level. */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

export type OrgRole = "owner" | "member" | "platform_admin";

export type EmployeeCountRange =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1000+";

export interface EuRelation {
  isEuBased: boolean;
  sellsToEu: boolean;
}

export interface OrganizationSubscription {
  planId: PlanId;
  status: "active" | "trialing" | "past_due" | "canceled";
  /** null on the Free plan, which has no billing period to end. */
  currentPeriodEnd: FirestoreTimestamp | null;
}

/** Usage counters used to enforce plan limits; server-write-only. */
export interface OrganizationUsage {
  documentsGeneratedThisMonth: number;
  registeredSystemsCount: number;
}

/** Where AI shows up in the org's business, captured once during onboarding. */
export type AiUsageContext = "products" | "internal_processes" | "both";

export interface OrganizationDoc {
  companyName: string;
  country: string;
  industry: string;
  employeeCountRange: EmployeeCountRange;
  euRelation: EuRelation;
  aiUsageContext: AiUsageContext;
  createdAt: FirestoreTimestamp;
  subscription: OrganizationSubscription;
  usage: OrganizationUsage;
}

export interface UserDoc {
  organizationId: string;
  role: OrgRole;
  email: string;
  createdAt: FirestoreTimestamp;
}

export type AiSystemStatus = "planned" | "active" | "inactive" | "retired";

export interface AiSystemDoc {
  name: string;
  purpose: string;
  vendor: string;
  dataTypes: string[];
  affectedGroups: string[];
  decisionMakingRole: string;
  status: AiSystemStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type RiskTier = "unacceptable" | "high" | "limited" | "minimal";
export type ConfidenceLevel = "low" | "medium" | "high";

export interface AssessmentDoc {
  aiSystemId: string;
  version: number;
  riskTier: RiskTier;
  legalArticleReference: string;
  justification: string;
  confidenceLevel: ConfidenceLevel;
  isEdgeCase: boolean;
  createdAt: FirestoreTimestamp;
  createdBy: string;
}

export type ComplianceDocumentType =
  | "risk_classification_report"
  | "technical_documentation"
  | "conformity_declaration"
  | "instructions_for_use";

export type ComplianceDocumentStatus = "draft" | "approved";

export interface ComplianceDocumentDoc {
  assessmentId: string;
  type: ComplianceDocumentType;
  version: number;
  content: string;
  status: ComplianceDocumentStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface TrainingRecordDoc {
  staffName: string;
  trainingType: string;
  completionDate: FirestoreTimestamp;
  certificateInfo: string;
  createdAt: FirestoreTimestamp;
}

export type AuditAction =
  | "record_created"
  | "record_updated"
  | "document_generated"
  | "classification_changed"
  | "organization_created"
  | "invite_sent"
  | "invite_accepted";

/** Append-only: server (Admin SDK) writes only, never updated or deleted. */
export interface AuditLogEntryDoc {
  actorId: string;
  action: AuditAction;
  targetCollection: string;
  targetId: string;
  timestamp: FirestoreTimestamp;
  metadata?: Record<string, unknown>;
}

export type InviteStatus = "pending" | "accepted" | "expired";

/**
 * Team invites. Looked up by `token` via a collectionGroup query (see
 * firestore.indexes.json), not by document ID, since the invite link only
 * carries the token. Fully server-write-only — created and accepted through
 * Admin SDK API routes, never touched by the client SDK.
 */
export interface InviteDoc {
  email: string;
  role: "member";
  token: string;
  status: InviteStatus;
  invitedBy: string;
  createdAt: FirestoreTimestamp;
  expiresAt: FirestoreTimestamp;
  acceptedAt?: FirestoreTimestamp;
}
