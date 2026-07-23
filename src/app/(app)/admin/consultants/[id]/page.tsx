import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ConsultantDoc, type ExpertReviewDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { ConsultantStatusActions } from "@/components/admin/consultant-admin-actions";

export const metadata = constructMetadata({
  title: "Consultant profile",
  path: "/admin/consultants",
  noIndex: true,
});

interface PageProps {
  params: { id: string };
}

export default async function AdminConsultantDetailPage({ params }: PageProps) {
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
  const consultantSnap = await db.doc(firestorePaths.consultant(params.id)).get();
  if (!consultantSnap.exists) notFound();
  const consultant = consultantSnap.data() as ConsultantDoc;

  const casesSnap = await db.collection(firestorePaths.expertReviews()).where("consultantId", "==", params.id).get();
  const cases = casesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as ExpertReviewDoc) }));

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: cases.filter((c) => c.rating?.stars === stars).length,
  }));
  const totalCommission = cases.reduce((sum, c) => sum + (c.commissionAmount ?? 0), 0);
  const totalFees = cases.reduce((sum, c) => sum + (c.proposal?.estimatedTotal ?? 0), 0);
  const completedCases = cases.filter((c) => c.status === "review_submitted" || c.status === "completed");
  const avgTurnaroundDays =
    completedCases.length === 0
      ? null
      : completedCases.reduce((sum, c) => {
          if (!c.report) return sum;
          return sum + (c.report.submittedAt.toDate().getTime() - c.createdAt.toDate().getTime()) / 86_400_000;
        }, 0) / completedCases.length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">{consultant.name || "(profile incomplete)"}</h1>
        <ConsultantStatusActions consultantId={params.id} status={consultant.approvalStatus} />
      </div>
      <p className="mt-1 text-navy-600">{consultant.email}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Section title="Profile">
          <Field label="Expertise">{consultant.expertiseAreas?.join(", ") || "—"}</Field>
          <Field label="Languages">{consultant.languages?.join(", ").toUpperCase() || "—"}</Field>
          <Field label="Hourly rate">€{consultant.hourlyRate}/hr</Field>
          <Field label="Years of experience">{consultant.yearsExperience}</Field>
          <Field label="Typical turnaround">{consultant.averageTurnaround}</Field>
          <Field label="Works with Turkey">{consultant.worksWithTurkey ? "Yes" : "No"}</Field>
          <Field label="Certifications">{consultant.certifications?.join(", ") || "—"}</Field>
          <Field label="References">{consultant.references?.join(", ") || "—"}</Field>
          <Field label="Bio">{consultant.bio || "—"}</Field>
        </Section>

        <Section title="Performance">
          <Field label="Cases completed">{consultant.casesCompleted}</Field>
          <Field label="Avg. turnaround">{avgTurnaroundDays !== null ? `${avgTurnaroundDays.toFixed(1)} days` : "—"}</Field>
          <Field label="Revenue (consultant fees, all-time)">€{totalFees.toFixed(0)}</Field>
          <Field label="Vermoncy commission (all-time)">€{totalCommission.toFixed(0)}</Field>
          <div className="pt-2">
            <p className="mb-1 text-xs text-navy-500">Rating distribution ({consultant.ratingCount} ratings, avg {consultant.ratingAverage.toFixed(1)})</p>
            {ratingDistribution.map(({ stars, count }) => (
              <div key={stars} className="flex items-center gap-2 text-xs text-navy-600">
                <span className="w-8">{stars}★</span>
                <div className="h-2 flex-1 rounded-full bg-navy-100">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: consultant.ratingCount > 0 ? `${(count / consultant.ratingCount) * 100}%` : "0%" }}
                  />
                </div>
                <span className="w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Cases ({cases.length})</h2>
        <div className="mt-3 space-y-2">
          {cases.length === 0 ? (
            <p className="text-sm text-navy-500">No cases yet.</p>
          ) : (
            cases.map((c) => (
              <Link
                key={c.id}
                href={`/admin/expert-reviews/${c.id}`}
                className="flex items-center justify-between rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm hover:bg-navy-50"
              >
                <span className="text-navy-900">{c.status.replace(/_/g, " ")}</span>
                <span className="text-xs text-navy-500">{c.createdAt.toDate().toLocaleDateString()}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">{title}</h2>
      <div className="mt-3 space-y-2 rounded-xl border border-navy-100 bg-surface p-5">{children}</div>
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
