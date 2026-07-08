import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  firestorePaths,
  type AiSystemDoc,
  type ConsultantDoc,
  type ExpertReviewDoc,
  type ExpertReviewStatus,
} from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { ProposalActions, RatingForm } from "@/components/risk-assessment/expert-review-actions";

export const metadata = constructMetadata({
  title: "Expert Reviews",
  path: "/expert-reviews",
  noIndex: true,
});

const STATUS_LABELS: Record<ExpertReviewStatus, string> = {
  pending_assignment: "Waiting to be matched with a consultant",
  accepted: "A consultant is preparing a proposal",
  proposal_sent: "Proposal received",
  proposal_declined: "Proposal declined — waiting for a new one",
  payment_received: "Review in progress",
  review_submitted: "Review ready",
  completed: "Completed",
};

async function loadDetails(review: ExpertReviewDoc & { id: string }, orgId: string) {
  const db = getAdminFirestore();
  const [systemSnap, consultantSnap] = await Promise.all([
    db.doc(firestorePaths.aiSystem(orgId, review.aiSystemId)).get(),
    review.consultantId ? db.doc(firestorePaths.consultant(review.consultantId)).get() : Promise.resolve(null),
  ]);
  const system = systemSnap.data() as AiSystemDoc | undefined;
  const consultant = consultantSnap?.data() as ConsultantDoc | undefined;
  return { ...review, systemName: system?.name ?? "Unknown system", consultant: consultant ?? null };
}

export default async function ExpertReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const snap = await db.collection(firestorePaths.expertReviews()).where("organizationId", "==", orgId).get();

  const reviews = await Promise.all(
    snap.docs.map((d) => loadDetails({ id: d.id, ...(d.data() as ExpertReviewDoc) }, orgId))
  );
  reviews.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Expert Reviews</h1>
      <p className="mt-1 text-navy-600">Requests you&apos;ve sent to the Complyra consultant network.</p>

      {reviews.length === 0 ? (
        <p className="mt-8 text-sm text-navy-500">
          No expert review requests yet. Request one from a system&apos;s risk assessment when it&apos;s flagged as an
          edge case.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-navy-100 bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-navy-900">{r.systemName}</p>
                <span className="text-xs font-medium text-navy-500">{STATUS_LABELS[r.status]}</span>
              </div>

              {r.status === "proposal_sent" && r.proposal && (
                <div className="mt-4 space-y-3 rounded-md bg-navy-50 p-4">
                  <p className="text-sm text-navy-800">
                    <span className="font-semibold">{r.consultant?.name ?? "Consultant"}</span> proposed{" "}
                    <span className="font-semibold">€{r.proposal.estimatedTotal}</span> — {r.proposal.deliveryFormat}
                  </p>
                  <p className="whitespace-pre-line text-sm text-navy-700">{r.proposal.scopeDescription}</p>
                  <ProposalActions reviewId={r.id} />
                </div>
              )}

              {r.status === "payment_received" && (
                <p className="mt-3 text-sm text-navy-600">
                  Payment confirmed — {r.consultant?.name ?? "your consultant"} is reviewing your case.
                </p>
              )}

              {(r.status === "review_submitted" || r.status === "completed") && r.report && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-navy-400">Executive summary</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-navy-800">{r.report.executiveSummary}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-400">Legal analysis</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-navy-800">{r.report.legalAnalysis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-400">Recommendation</p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-navy-800">{r.report.recommendation}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href={`/api/expert-reviews/${r.id}/pdf`}
                      className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
                    >
                      Download PDF
                    </a>
                    {r.consultant && (
                      <a href={`mailto:${r.consultant.email}`} className="text-sm font-medium text-accent hover:text-accent-600">
                        Contact {r.consultant.name}
                      </a>
                    )}
                  </div>
                  {r.status === "review_submitted" && (
                    <div className="border-t border-navy-100 pt-4">
                      <p className="mb-2 text-xs font-medium text-navy-400">Rate this review</p>
                      <RatingForm reviewId={r.id} />
                    </div>
                  )}
                  {r.status === "completed" && r.rating && (
                    <p className="text-sm text-navy-600">
                      You rated this review {r.rating.stars} / 5{r.rating.comment && ` — "${r.rating.comment}"`}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
