import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentConsultant } from "@/lib/auth/current-consultant";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc, type ExpertReviewDoc, type ExpertReviewStatus, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { AcceptCaseButton } from "@/components/consultant/accept-case-button";

export const metadata = constructMetadata({
  title: "Consultant dashboard",
  path: "/consultant/dashboard",
  noIndex: true,
});

const STATUS_LABELS: Record<ExpertReviewStatus, string> = {
  pending_assignment: "Pending assignment",
  accepted: "Accepted — send a proposal",
  proposal_sent: "Proposal sent — awaiting client",
  proposal_declined: "Proposal declined",
  payment_received: "Payment received — under review",
  review_submitted: "Review submitted",
  completed: "Completed",
};

async function loadCaseSummary(review: ExpertReviewDoc & { id: string }) {
  const db = getAdminFirestore();
  const [orgSnap, systemSnap] = await Promise.all([
    db.doc(firestorePaths.organization(review.organizationId)).get(),
    db.doc(firestorePaths.aiSystem(review.organizationId, review.aiSystemId)).get(),
  ]);
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  const system = systemSnap.data() as AiSystemDoc | undefined;
  return { ...review, orgName: organization?.companyName ?? "Unknown company", systemName: system?.name ?? "Unknown system" };
}

export default async function ConsultantDashboardPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) redirect("/login");
  if (consultant.consultant.name.trim().length === 0) redirect("/consultant/onboarding");

  const db = getAdminFirestore();
  const [incomingSnap, myCasesSnap] = await Promise.all([
    db.collection(firestorePaths.expertReviews()).where("status", "==", "pending_assignment").get(),
    db.collection(firestorePaths.expertReviews()).where("consultantId", "==", consultant.uid).get(),
  ]);

  const incoming = await Promise.all(
    incomingSnap.docs.map((d) => loadCaseSummary({ id: d.id, ...(d.data() as ExpertReviewDoc) }))
  );
  const myCases = await Promise.all(
    myCasesSnap.docs.map((d) => loadCaseSummary({ id: d.id, ...(d.data() as ExpertReviewDoc) }))
  );
  myCases.sort((a, b) => b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime());

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Consultant dashboard</h1>
      <p className="mt-1 text-navy-600">Incoming requests and your active cases.</p>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Incoming requests</h2>
        {incoming.length === 0 ? (
          <p className="mt-3 text-sm text-navy-500">No open requests right now.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {incoming.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-surface p-5">
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {c.orgName} — {c.systemName}
                  </p>
                  <p className="mt-1 text-xs text-navy-500">
                    Turnaround: {c.preferredTurnaround} · Language: {c.languagePreference}
                    {c.budgetCeiling ? ` · Budget ceiling: €${c.budgetCeiling}` : ""}
                  </p>
                </div>
                <AcceptCaseButton caseId={c.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">My cases</h2>
        {myCases.length === 0 ? (
          <p className="mt-3 text-sm text-navy-500">You haven&apos;t accepted any cases yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {myCases.map((c) => (
              <Link
                key={c.id}
                href={`/consultant/cases/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-surface p-5 hover:bg-navy-50"
              >
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {c.orgName} — {c.systemName}
                  </p>
                  <p className="mt-1 text-xs text-navy-500">{STATUS_LABELS[c.status]}</p>
                </div>
                <span className="text-xs font-medium text-accent">Open case →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
