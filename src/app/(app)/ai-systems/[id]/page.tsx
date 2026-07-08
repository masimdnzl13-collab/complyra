import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc, type AssessmentDoc, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { planHasExpertReviewAccess } from "@/config/site";
import { ArchiveButton } from "@/components/ai-systems/archive-button";
import { RequestExpertReview } from "@/components/risk-assessment/request-expert-review";

const RISK_TIER_STYLES: Record<AssessmentDoc["riskTier"], string> = {
  unacceptable: "border-danger bg-danger/5",
  high: "border-warning bg-warning/5",
  limited: "border-accent bg-accent/5",
  minimal: "border-success bg-success/5",
};

const RISK_TIER_LABELS: Record<AssessmentDoc["riskTier"], string> = {
  unacceptable: "Prohibited practice",
  high: "High risk",
  limited: "Limited risk",
  minimal: "Minimal risk",
};

const CONFIDENCE_LABELS: Record<AssessmentDoc["confidenceLevel"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export const metadata = constructMetadata({
  title: "AI system details",
  path: "/ai-systems",
  noIndex: true,
});

const BUSINESS_AREA_LABELS: Record<AiSystemDoc["businessArea"], string> = {
  hr: "HR",
  customer_service: "Customer service",
  marketing_content: "Marketing / content",
  finance_credit: "Finance / credit",
  product_feature: "Product feature",
  operations: "Operations",
  other: "Other",
};

const DATA_TYPE_LABELS: Record<AiSystemDoc["dataTypes"][number], string> = {
  personal: "Personal data",
  sensitive_personal: "Sensitive personal data",
  biometric: "Biometric data",
  customer: "Customer data",
  employee: "Employee data",
  anonymous_corporate: "Anonymous / corporate data",
};

const AFFECTED_GROUP_LABELS: Record<AiSystemDoc["affectedGroups"][number], string> = {
  employees: "Employees",
  job_applicants: "Job applicants",
  customers: "Customers",
  children_vulnerable: "Children or vulnerable groups",
  general_public: "General public",
};

const DECISION_ROLE_LABELS: Record<AiSystemDoc["decisionMakingRole"], string> = {
  info_only: "Provides information only — a person decides",
  human_in_the_loop: "Feeds into a human decision",
  autonomous: "Decides on its own, without human approval",
};

const STATUS_LABELS: Record<AiSystemDoc["status"], string> = {
  active: "Active",
  planned: "Planned",
  inactive: "Inactive",
  retired: "Archived",
};

interface DetailPageProps {
  params: { id: string };
}

export default async function AiSystemDetailPage({ params }: DetailPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const snap = await db.doc(firestorePaths.aiSystem(orgId, params.id)).get();
  if (!snap.exists) notFound();
  const system = snap.data() as AiSystemDoc;
  const isOwner = user.userDoc.role === "owner";

  const orgSnap = await db.doc(firestorePaths.organization(orgId)).get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  const canRequestExpertReview = !!organization && planHasExpertReviewAccess(organization.subscription.planId);

  let assessment: (AssessmentDoc & { id: string }) | null = null;
  if (system.assessmentStatus === "assessed") {
    const assessmentSnap = await db
      .collection(firestorePaths.assessments(orgId))
      .where("aiSystemId", "==", params.id)
      .where("status", "==", "active")
      .limit(1)
      .get();
    if (!assessmentSnap.empty) {
      const doc = assessmentSnap.docs[0];
      assessment = { id: doc.id, ...(doc.data() as AssessmentDoc) };
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{system.name}</h1>
          <p className="mt-1 text-navy-600">{system.description}</p>
        </div>
        <span className="rounded-full bg-navy-50 px-3 py-1 text-sm font-medium text-navy-600">
          {STATUS_LABELS[system.status]}
        </span>
      </div>

      {isOwner && (
        <div className="mt-6 flex gap-3">
          <Link
            href={`/ai-systems/${params.id}/edit`}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
          >
            Edit
          </Link>
          {system.status !== "retired" && <ArchiveButton systemId={params.id} />}
        </div>
      )}

      <div className="mt-10 space-y-8">
        <Section title="Identity & vendor">
          <Field label="Role">{system.role === "provider" ? "Provider (our own system)" : "Deployer (a tool we use)"}</Field>
          <Field label="Built on / vendor">{system.vendor}</Field>
        </Section>

        <Section title="Usage context">
          <Field label="Business area">{BUSINESS_AREA_LABELS[system.businessArea]}</Field>
          <Field label="What it does">{system.purpose}</Field>
        </Section>

        <Section title="Data profile">
          <Field label="Data types">{system.dataTypes.map((d) => DATA_TYPE_LABELS[d]).join(", ")}</Field>
        </Section>

        <Section title="Impact profile">
          <Field label="Affected groups">{system.affectedGroups.map((g) => AFFECTED_GROUP_LABELS[g]).join(", ")}</Field>
          <Field label="Decision-making role">{DECISION_ROLE_LABELS[system.decisionMakingRole]}</Field>
        </Section>

        <Section title="Visibility">
          <Field label="Talks directly with people">{system.interactsWithPeople ? "Yes" : "No"}</Field>
          <Field label="Generates synthetic content">{system.generatesSyntheticContent ? "Yes" : "No"}</Field>
          <Field label="Infers emotion or behavior">{system.infersEmotionOrBehavior ? "Yes" : "No"}</Field>
        </Section>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Risk assessment</h2>

        {!assessment ? (
          <div className="mt-3 rounded-xl border border-dashed border-navy-200 bg-navy-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-navy-900">Not assessed yet</p>
                <p className="mt-1 text-sm text-navy-600">
                  Determine this system&apos;s risk classification under the EU AI Act.
                </p>
              </div>
              {isOwner && (
                <Link
                  href={`/assessments/${params.id}/new`}
                  className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
                >
                  Assess risk
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className={`mt-3 rounded-xl border-2 p-6 ${RISK_TIER_STYLES[assessment.riskTier]}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`rounded-full px-3 py-1.5 text-sm font-bold uppercase tracking-wide ${
                  assessment.riskTier === "unacceptable" ? "bg-danger text-white" : "bg-navy-900/5 text-navy-800"
                }`}
              >
                {RISK_TIER_LABELS[assessment.riskTier]}
              </span>
              <span className="text-xs font-medium text-navy-500">
                {CONFIDENCE_LABELS[assessment.confidenceLevel]} · v{assessment.version}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-navy-900">{assessment.legalArticleReference}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{assessment.justification}</p>

            {assessment.isEdgeCase && (
              <div className="mt-4 space-y-3">
                <div className="rounded-md bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning">
                  Expert review recommended before relying on this classification.
                </div>
                {isOwner && (
                  <RequestExpertReview
                    assessmentId={assessment.id}
                    canRequest={canRequestExpertReview}
                    defaultNotes={`System: ${system.name}\nRisk tier: ${assessment.riskTier}\nAssessment summary: ${assessment.justification}`}
                  />
                )}
              </div>
            )}

            {isOwner && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/assessments/${params.id}/new`}
                  className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
                >
                  Reassess
                </Link>
                <a
                  href={`/api/assessments/${assessment.id}/pdf`}
                  className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
                >
                  Download PDF
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">{title}</h2>
      <div className="mt-3 space-y-3 rounded-xl border border-navy-100 bg-surface p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-navy-400">{label}</p>
      <p className="mt-0.5 text-sm text-navy-800">{children}</p>
    </div>
  );
}
