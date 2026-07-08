import { notFound, redirect } from "next/navigation";
import { getCurrentConsultant } from "@/lib/auth/current-consultant";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  firestorePaths,
  type AiSystemDoc,
  type AssessmentDoc,
  type ExpertReviewDoc,
  type OrganizationDoc,
} from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { SendProposalForm } from "@/components/consultant/send-proposal-form";
import { SubmitReviewForm } from "@/components/consultant/submit-review-form";

export const metadata = constructMetadata({
  title: "Case detail",
  path: "/consultant/cases",
  noIndex: true,
});

interface CasePageProps {
  params: { id: string };
}

export default async function ConsultantCasePage({ params }: CasePageProps) {
  const consultant = await getCurrentConsultant();
  if (!consultant) redirect("/login");
  if (consultant.consultant.name.trim().length === 0) redirect("/consultant/onboarding");

  const db = getAdminFirestore();
  const reviewSnap = await db.doc(firestorePaths.expertReview(params.id)).get();
  if (!reviewSnap.exists) notFound();
  const review = reviewSnap.data() as ExpertReviewDoc;

  if (review.consultantId !== consultant.uid) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-navy-900">Not your case</h1>
        <p className="mt-2 text-sm text-navy-600">This case is assigned to a different consultant.</p>
      </div>
    );
  }

  const [orgSnap, systemSnap, assessmentSnap] = await Promise.all([
    db.doc(firestorePaths.organization(review.organizationId)).get(),
    db.doc(firestorePaths.aiSystem(review.organizationId, review.aiSystemId)).get(),
    db.doc(firestorePaths.assessment(review.organizationId, review.assessmentId)).get(),
  ]);
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  const system = systemSnap.data() as AiSystemDoc | undefined;
  const assessment = assessmentSnap.data() as AssessmentDoc | undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
        {organization?.companyName ?? "Unknown company"} — {system?.name ?? "Unknown system"}
      </h1>
      <p className="mt-1 text-navy-600">
        Preferred turnaround: {review.preferredTurnaround} · Language: {review.languagePreference}
        {review.budgetCeiling ? ` · Budget ceiling: €${review.budgetCeiling}` : ""}
      </p>

      <div className="mt-8 space-y-6">
        {assessment && (
          <Section title="Assessment report (P7 output)">
            <Field label="Risk tier">{assessment.riskTier}</Field>
            <Field label="Confidence">{assessment.confidenceLevel}</Field>
            <Field label="Legal reference">{assessment.legalArticleReference}</Field>
            <Field label="Justification">{assessment.justification}</Field>
            {assessment.isEdgeCase && (
              <p className="text-sm font-medium text-warning">Flagged as an edge case requiring expert review.</p>
            )}
          </Section>
        )}

        <Section title="Client's notes">
          <p className="whitespace-pre-line text-sm text-navy-700">{review.userNotes}</p>
        </Section>
      </div>

      <div className="mt-8">
        {(review.status === "accepted" || review.status === "proposal_declined") && (
          <SendProposalForm caseId={params.id} defaultHourlyRate={consultant.consultant.hourlyRate} />
        )}

        {review.status === "proposal_sent" && review.proposal && (
          <div className="rounded-xl border border-navy-100 bg-navy-50 p-6">
            <p className="text-sm font-semibold text-navy-900">Proposal sent — awaiting client response</p>
            <p className="mt-2 text-sm text-navy-700">
              €{review.proposal.estimatedTotal} · {review.proposal.deliveryFormat}
            </p>
          </div>
        )}

        {review.status === "payment_received" && <SubmitReviewForm caseId={params.id} />}

        {(review.status === "review_submitted" || review.status === "completed") && review.report && (
          <div className="space-y-4 rounded-xl border border-navy-100 bg-surface p-6">
            <p className="text-sm font-semibold text-success">Review submitted</p>
            <Field label="Executive summary">{review.report.executiveSummary}</Field>
            <Field label="Legal analysis">{review.report.legalAnalysis}</Field>
            <Field label="Recommendation">{review.report.recommendation}</Field>
            {review.rating && (
              <Field label="Client rating">
                {review.rating.stars} / 5 {review.rating.comment && `— "${review.rating.comment}"`}
              </Field>
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
      <p className="mt-0.5 whitespace-pre-line text-sm text-navy-800">{children}</p>
    </div>
  );
}
