import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  firestorePaths,
  type AiSystemDoc,
  type ConsultantDoc,
  type ExpertReviewDoc,
  type OrganizationDoc,
} from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { FlagReviewButton } from "@/components/admin/flag-review-button";

export const metadata = constructMetadata({
  title: "Expert review case",
  path: "/admin/expert-reviews",
  noIndex: true,
});

interface PageProps {
  params: { id: string };
}

export default async function AdminExpertReviewCasePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperAdminUid(user.uid)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">403 — Forbidden</h1>
        <p className="mt-2 text-navy-600">This page is only available to the platform superadmin.</p>
      </div>
    );
  }

  const db = getAdminFirestore();
  const reviewSnap = await db.doc(firestorePaths.expertReview(params.id)).get();
  if (!reviewSnap.exists) notFound();
  const review = reviewSnap.data() as ExpertReviewDoc;

  const [orgSnap, systemSnap, consultantSnap] = await Promise.all([
    db.doc(firestorePaths.organization(review.organizationId)).get(),
    db.doc(firestorePaths.aiSystem(review.organizationId, review.aiSystemId)).get(),
    review.consultantId ? db.doc(firestorePaths.consultant(review.consultantId)).get() : Promise.resolve(null),
  ]);
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  const system = systemSnap.data() as AiSystemDoc | undefined;
  const consultant = consultantSnap?.data() as ConsultantDoc | undefined;

  const timeline: { label: string; date: Date | null; detail?: string }[] = [
    { label: "Requested", date: review.createdAt.toDate(), detail: review.userNotes },
    {
      label: "Proposal sent",
      date: review.proposal?.sentAt.toDate() ?? null,
      detail: review.proposal ? `€${review.proposal.estimatedTotal} — ${review.proposal.deliveryFormat}` : undefined,
    },
    {
      label: "Payment received",
      date: review.paymentReceivedAt?.toDate() ?? null,
      detail: review.commissionAmount ? `Commission: €${review.commissionAmount}` : undefined,
    },
    {
      label: "Review submitted",
      date: review.report?.submittedAt.toDate() ?? null,
      detail: review.report?.executiveSummary,
    },
    {
      label: "Rated",
      date: review.rating?.ratedAt.toDate() ?? null,
      detail: review.rating ? `${review.rating.stars}/5${review.rating.comment ? ` — "${review.rating.comment}"` : ""}` : undefined,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
          {organization?.companyName ?? "Unknown org"} — {system?.name ?? "Unknown system"}
        </h1>
        <FlagReviewButton reviewId={params.id} flagged={review.flaggedForQualityReview} />
      </div>
      <p className="mt-1 text-navy-600">
        Consultant: {consultant?.name ?? "Unassigned"} · Status: {review.status.replace(/_/g, " ")}
      </p>

      <div className="mt-8 space-y-4">
        {timeline.map((step, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 ${step.date ? "border-navy-100 bg-surface" : "border-dashed border-navy-200 bg-navy-50 opacity-50"}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-900">{step.label}</p>
              <p className="text-xs text-navy-500">{step.date ? step.date.toLocaleString() : "Not yet"}</p>
            </div>
            {step.detail && <p className="mt-1 whitespace-pre-line text-sm text-navy-700">{step.detail}</p>}
          </div>
        ))}
      </div>

      {review.report && (
        <div className="mt-8 rounded-xl border border-navy-100 bg-surface p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Full report</h2>
          <div className="mt-3 space-y-3 text-sm text-navy-700">
            <p>
              <span className="font-semibold text-navy-900">Legal analysis: </span>
              {review.report.legalAnalysis}
            </p>
            <p>
              <span className="font-semibold text-navy-900">Recommendation: </span>
              {review.report.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
