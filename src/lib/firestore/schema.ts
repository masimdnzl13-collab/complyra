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
 *     organizations/{orgId}/article50Artifacts/{artifactId} (chatbot/labeling/watermark/deepfake)
 *     organizations/{orgId}/trainingRecords/{recordId}
 *     organizations/{orgId}/auditLog/{entryId}            (append-only, server-write-only)
 *     organizations/{orgId}/invites/{inviteId}            (server-write-only, looked up by token)
 *   newsletterSubscribers/{email}                          (top-level, server-write-only)
 *   leads/{leadId}                                          (top-level, server-write-only, risk-scan report data)
 *   consultants/{uid}                                       (top-level, keyed by the consultant's Firebase uid — a
 *                                                             separate identity track from users/{uid}, not org-scoped)
 *   consultantInvites/{inviteId}                            (top-level, server-write-only, looked up by token)
 *   expertReviews/{reviewId}                                (top-level, references organizationId + assessmentId —
 *                                                             top-level rather than a subcollection because consultants
 *                                                             need to query across organizations for their own cases)
 */

export const COLLECTIONS = {
  organizations: "organizations",
  users: "users",
  aiSystems: "aiSystems",
  assessments: "assessments",
  documents: "documents",
  article50Artifacts: "article50Artifacts",
  trainingRecords: "trainingRecords",
  auditLog: "auditLog",
  invites: "invites",
  newsletterSubscribers: "newsletterSubscribers",
  leads: "leads",
  consultants: "consultants",
  consultantInvites: "consultantInvites",
  expertReviews: "expertReviews",
  platformAuditLog: "platformAuditLog",
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

  article50Artifacts: (orgId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.article50Artifacts}`,
  article50Artifact: (orgId: string, artifactId: string) =>
    `${COLLECTIONS.organizations}/${orgId}/${COLLECTIONS.article50Artifacts}/${artifactId}`,

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

  newsletterSubscribers: () => COLLECTIONS.newsletterSubscribers,
  newsletterSubscriber: (docId: string) =>
    `${COLLECTIONS.newsletterSubscribers}/${docId}`,

  leads: () => COLLECTIONS.leads,
  lead: (leadId: string) => `${COLLECTIONS.leads}/${leadId}`,

  consultants: () => COLLECTIONS.consultants,
  consultant: (uid: string) => `${COLLECTIONS.consultants}/${uid}`,

  consultantInvites: () => COLLECTIONS.consultantInvites,
  consultantInvite: (inviteId: string) => `${COLLECTIONS.consultantInvites}/${inviteId}`,

  expertReviews: () => COLLECTIONS.expertReviews,
  expertReview: (reviewId: string) => `${COLLECTIONS.expertReviews}/${reviewId}`,

  /** Platform-level actions (consultant invites/approvals) aren't scoped to any one organization, so they get their own top-level audit log rather than a fake org. */
  platformAuditLog: () => COLLECTIONS.platformAuditLog,
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

/**
 * "expires_soon" is never stored — it's a derived display state (a
 * cancelled subscription whose paid period hasn't ended yet), computed
 * where it's shown rather than persisted, so it can never drift out of
 * sync with the real stored status.
 */
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "cancelled";

export interface OrganizationSubscription {
  planId: PlanId;
  status: SubscriptionStatus;
  billingInterval: "month" | "year" | null;
  lemonSqueezyCustomerId: string | null;
  lemonSqueezySubscriptionId: string | null;
  currentPeriodStart: FirestoreTimestamp | null;
  /** null on the Free plan, which has no billing period to end. */
  currentPeriodEnd: FirestoreTimestamp | null;
  nextBillingDate: FirestoreTimestamp | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  trialEndDate: FirestoreTimestamp | null;
  trialStatus: "active" | "expired" | "converted_to_paid" | null;
}

/**
 * Usage counters used to enforce plan limits; server-write-only.
 * `documentsGeneratedThisMonth`/`assessmentsThisMonth`/`article50TextsThisMonth`
 * are lazily reset whenever `usageMonthKey` (an ISO "YYYY-MM" string) no
 * longer matches the current month — see src/lib/usage/monthly-quota.ts.
 * The billing cron (P12) also does a proactive sweep at UTC midnight on the
 * 1st so a stale key isn't left sitting until the org's next quota check,
 * but the lazy check remains the source of truth either way.
 * AI literacy seats used is intentionally *not* duplicated here — it's
 * read live via a count() on trainingRecords (see P10), which can't drift
 * out of sync the way a manually-incremented counter could.
 */
export interface OrganizationUsage {
  documentsGeneratedThisMonth: number;
  assessmentsThisMonth: number;
  article50TextsThisMonth: number;
  registeredSystemsCount: number;
  /** Tracked for admin visibility (P13); no hard monthly cap is currently enforced against it. */
  expertReviewsThisMonth: number;
  usageMonthKey: string;
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

/** The organization's relationship to this specific system — not the org-wide profile from onboarding. */
export type AiSystemRole = "provider" | "deployer";

export type BusinessArea =
  | "hr"
  | "customer_service"
  | "marketing_content"
  | "finance_credit"
  | "product_feature"
  | "operations"
  | "other";

export type AiDataType =
  | "personal"
  | "sensitive_personal"
  | "biometric"
  | "customer"
  | "employee"
  | "anonymous_corporate";

export type AffectedGroup =
  | "employees"
  | "job_applicants"
  | "customers"
  | "children_vulnerable"
  | "general_public";

export type DecisionMakingRole = "info_only" | "human_in_the_loop" | "autonomous";

/** Whether risk classification (a later step) has run against this system yet. */
export type AssessmentStatus = "not_assessed" | "assessed";

export interface AiSystemDoc {
  name: string;
  /** Short identity blurb, distinct from `purpose` (what it concretely does). */
  description: string;
  role: AiSystemRole;
  /** Third-party vendor + product if deployed, or the foundation model/infra it's built on if it's the org's own system. Free text. */
  vendor: string;
  businessArea: BusinessArea;
  purpose: string;
  dataTypes: AiDataType[];
  affectedGroups: AffectedGroup[];
  decisionMakingRole: DecisionMakingRole;
  /** Visibility trio — captured separately for the future Article 50 transparency mapping. */
  interactsWithPeople: boolean;
  generatesSyntheticContent: boolean;
  infersEmotionOrBehavior: boolean;
  status: AiSystemStatus;
  assessmentStatus: AssessmentStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type RiskTier = "unacceptable" | "high" | "limited" | "minimal";
export type ConfidenceLevel = "low" | "medium" | "high";

/** The Annex III high-risk decision point selected at assessment time — drives which category gets checked. */
export type DecisionPoint =
  | "hiring_evaluation"
  | "credit_insurance"
  | "education_exam"
  | "law_enforcement"
  | "migration_border"
  | "public_benefits"
  | "judicial_decision"
  | "none";

export type SystemDeploymentStage = "production" | "testing" | "planned";

export type AnnexIIICategory =
  | "biometrics"
  | "employment"
  | "education"
  | "essential_services"
  | "law_enforcement"
  | "migration_border"
  | "justice_democratic";

/**
 * A single risk-classification run against one AI system. `status` drives
 * versioning: reassessing a system archives the prior "active" doc and
 * writes a new one with an incremented `version` — old assessments are
 * never deleted (audit-trail integrity, same principle as AI system
 * archival in CLAUDE.md).
 */
export interface AssessmentDoc {
  aiSystemId: string;
  version: number;
  status: "active" | "archived";
  decisionPoint: DecisionPoint;
  systemDeploymentStage: SystemDeploymentStage;
  /** ISO date string the user supplied for "when was this system last substantially modified". */
  systemLastModifiedAt: string;
  prohibitedPracticeDetected: boolean;
  prohibitedPracticeReference: string | null;
  /** Article 6(3) derogation — a high-risk-category system whose role is advisory-only isn't classified high-risk. */
  derogationApplies: boolean;
  annexIIICategory: AnnexIIICategory | null;
  riskTier: RiskTier;
  legalArticleReference: string;
  justification: string;
  confidenceLevel: ConfidenceLevel;
  isEdgeCase: boolean;
  createdAt: FirestoreTimestamp;
  createdBy: string;
}

export type ComplianceDocumentType =
  | "ai_use_policy"
  | "risk_assessment_report"
  | "human_oversight_procedure"
  | "vendor_assessment"
  | "fria";

export type ComplianceDocumentStatus = "draft" | "reviewed";

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
}

export interface DocumentFixedFields {
  companyName: string;
  systemName: string;
  assessmentDate: string;
  preparedBy: string;
  /** null until "review & approve" is clicked. */
  approvedAt: string | null;
}

/**
 * One version of a generated compliance document. Editing never overwrites
 * in place — see the versioning note on AssessmentDoc and the archival
 * principle in CLAUDE.md: `isCurrent` flips to false on the prior version
 * and a new doc is written with `version + 1`, so document history survives
 * intact for audit purposes.
 */
export interface ComplianceDocumentDoc {
  assessmentId: string;
  aiSystemId: string;
  type: ComplianceDocumentType;
  version: number;
  isCurrent: boolean;
  status: ComplianceDocumentStatus;
  fixedFields: DocumentFixedFields;
  sections: DocumentSection[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  createdBy: string;
}

export type Article50Area =
  | "chatbot_disclosure"
  | "content_labeling"
  | "watermark_checklist"
  | "deepfake_disclosure";

export type Article50ArtifactStatus = "draft" | "reviewed";

/**
 * A generated Article 50 artifact — a disclosure notice, labeling template,
 * watermark checklist, or deepfake/public-interest disclosure. The four
 * areas produce genuinely different shapes (free-text sections vs. a
 * checklist), so `data` is kept loosely typed here — same pattern as
 * `LeadDoc.answers`/`result` — with the real per-area shapes defined in
 * src/lib/article50/types.ts. Versioned and archived on edit, same
 * principle as ComplianceDocumentDoc.
 */
export interface Article50Artifact {
  area: Article50Area;
  /** null for org-wide artifacts (content labeling, watermark checklist, deepfake) that aren't tied to one system. */
  aiSystemId: string | null;
  version: number;
  isCurrent: boolean;
  status: Article50ArtifactStatus;
  title: string;
  data: Record<string, unknown>;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  createdBy: string;
}

export type EmployeeRole = "technical" | "hr" | "business" | "executive" | "general" | "other";

export interface ModuleProgress {
  attempts: number;
  bestScore: number;
  passed: boolean;
  passedAt: FirestoreTimestamp | null;
  /** True after 3 failed attempts — module is locked until an admin/expert reviews it. */
  blockedForExpertReview: boolean;
}

/**
 * One document per employee, keyed by their Firebase uid (see
 * firestorePaths.trainingRecord). `moduleProgress` is keyed by module ID —
 * this satisfies the org → user → module → completion-date shape the Article
 * 4 literacy record needs without a doc-per-completion fan-out, which keeps
 * the manager report a single collection scan instead of N queries.
 */
export interface TrainingRecordDoc {
  userId: string;
  userName: string;
  userEmail: string;
  role: EmployeeRole;
  startedAt: FirestoreTimestamp;
  /** null until every required module (5 common + 1 role-specific) is passed. */
  completedAt: FirestoreTimestamp | null;
  certificateId: string | null;
  moduleProgress: Record<string, ModuleProgress>;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type AuditAction =
  | "record_created"
  | "record_updated"
  | "document_generated"
  | "classification_changed"
  | "organization_created"
  | "invite_sent"
  | "invite_accepted"
  | "consultant_invited"
  | "consultant_approved"
  | "expert_review_requested"
  | "expert_review_accepted"
  | "proposal_sent"
  | "proposal_declined"
  | "payment_received"
  | "review_submitted"
  | "review_rated";

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
 * Team invites. Looked up by `token` via a collectionGroup query — this
 * requires the COLLECTION_GROUP field override on `token` declared in
 * firestore.indexes.json; Firestore's automatic indexing only covers
 * COLLECTION scope by default. Not looked up by document ID, since the
 * invite link only carries the token. Fully server-write-only — created
 * and accepted through Admin SDK API routes, never touched by the client SDK.
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

/**
 * Marketing newsletter signups from the homepage. Not org-scoped — anyone
 * can subscribe before ever creating an account. Server-write-only, same
 * pattern as invites: created only through the Admin SDK
 * (`/api/newsletter/subscribe`), never touched by the client SDK. Document
 * ID is the lowercased email so re-submitting the same address updates
 * rather than duplicates.
 */
export interface NewsletterSubscriberDoc {
  email: string;
  subscribedAt: FirestoreTimestamp;
  source: string;
}

/**
 * A free risk-scan submission that left an email address for the detailed
 * report. Server-write-only, same pattern as invites/newsletterSubscribers.
 * The document ID (an auto-generated Firestore ID) doubles as the
 * unpredictable, unguessable token in the public `/report/[id]` URL — no
 * separate token field needed, and re-submitting the same email just
 * creates another lead rather than hitting a uniqueness conflict.
 * `answers`/`result` are kept loosely typed here (see ScanAnswers/ScanResult
 * in src/lib/risk-scan/types.ts for the real shape) to avoid a schema.ts ↔
 * risk-scan/types.ts import cycle through EmployeeCountRange.
 */
export interface LeadDoc {
  email: string;
  answers: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: FirestoreTimestamp;
  source: string;
}

/**
 * P13 — consultant review marketplace. A consultant is a distinct identity
 * track from UserDoc: keyed by the same Firebase uid pool (they sign in the
 * same way, via getSessionUser()), but never has a UserDoc/organizationId —
 * getCurrentConsultant() looks them up in `consultants/{uid}` instead. One
 * person could in principle have both a UserDoc and a ConsultantDoc under
 * the same uid; that's fine, they're independent lookups.
 */
export type ConsultantApprovalStatus = "pending_approval" | "approved" | "active" | "rejected";
export type ConsultantLanguage = "en" | "de" | "tr";
export type ConsultantTurnaround = "24h" | "2d" | "1w";

export interface ConsultantDoc {
  email: string;
  name: string;
  expertiseAreas: string[];
  languages: ConsultantLanguage[];
  /** EUR/hour, used as the default when drafting a proposal. */
  hourlyRate: number;
  yearsExperience: number;
  bio: string;
  worksWithTurkey: boolean;
  certifications: string[];
  references: string[];
  approvalStatus: ConsultantApprovalStatus;
  averageTurnaround: ConsultantTurnaround;
  /** Self-reported — toggled by the consultant, not inferred from case load. */
  isAvailable: boolean;
  ratingAverage: number;
  ratingCount: number;
  casesCompleted: number;
  invitedBy: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type ConsultantInviteStatus = "pending" | "accepted" | "expired";

/** Same server-write-only, token-lookup pattern as InviteDoc, but top-level (not org-scoped) and admin-only. */
export interface ConsultantInviteDoc {
  email: string;
  token: string;
  status: ConsultantInviteStatus;
  invitedBy: string;
  createdAt: FirestoreTimestamp;
  expiresAt: FirestoreTimestamp;
  acceptedAt?: FirestoreTimestamp;
}

/**
 * Status machine for one expert-review case:
 *   pending_assignment -> accepted -> proposal_sent -> (proposal_declined, back to pending_assignment-like limbo, or)
 *   payment_received -> review_submitted -> completed (once the user rates it)
 * "under_review" from the spec's UX language is represented by payment_received —
 * there's no separate trigger that would distinguish a "started reviewing" moment
 * from "payment cleared", so collapsing them keeps every stored status tied to a
 * real event instead of an assumed one.
 */
export type ExpertReviewStatus =
  | "pending_assignment"
  | "accepted"
  | "proposal_sent"
  | "proposal_declined"
  | "payment_received"
  | "review_submitted"
  | "completed";

export type PreferredTurnaround = "24h" | "2d" | "1w";
export type ConsultantLanguagePreference = "en" | "de" | "tr" | "any";

export interface ExpertReviewProposal {
  hourlyRate: number;
  estimatedTotal: number;
  deliveryFormat: string;
  scopeDescription: string;
  sentAt: FirestoreTimestamp;
}

export interface ExpertReviewReport {
  executiveSummary: string;
  legalAnalysis: string;
  recommendation: string;
  submittedAt: FirestoreTimestamp;
}

export interface ExpertReviewRating {
  stars: number;
  comment: string;
  ratedAt: FirestoreTimestamp;
}

/**
 * Top-level (not a subcollection of organizations) because consultants need
 * to query across organizations for their own case list — a collectionGroup
 * query would work too, but a flat collection with an `organizationId` field
 * is simpler for both the org-scoped and consultant-scoped queries this needs.
 */
export interface ExpertReviewDoc {
  organizationId: string;
  assessmentId: string;
  aiSystemId: string;
  requestedBy: string;
  status: ExpertReviewStatus;
  userNotes: string;
  preferredTurnaround: PreferredTurnaround;
  languagePreference: ConsultantLanguagePreference;
  budgetCeiling: number | null;
  consultantId: string | null;
  proposal: ExpertReviewProposal | null;
  stripeCheckoutSessionId: string | null;
  /** Snapshotted at checkout-session creation time so analytics stay accurate even if the commission rate config changes later. */
  commissionAmount: number | null;
  paymentReceivedAt: FirestoreTimestamp | null;
  report: ExpertReviewReport | null;
  rating: ExpertReviewRating | null;
  flaggedForQualityReview: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}
