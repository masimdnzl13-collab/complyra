import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ConsultantDoc, type ExpertReviewDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { FlagReviewButton } from "@/components/admin/flag-review-button";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";

export const metadata = constructMetadata({
  title: "Expert Reviews",
  path: "/admin/expert-reviews",
  noIndex: true,
});

const COMPLETED_STATUSES = new Set(["review_submitted", "completed"]);

export default async function AdminExpertReviewsPage() {
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
  const [reviewsSnap, consultantsSnap] = await Promise.all([
    db.collection(firestorePaths.expertReviews()).get(),
    db.collection(firestorePaths.consultants()).get(),
  ]);
  const reviews = reviewsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as ExpertReviewDoc) }));
  const consultants = new Map(consultantsSnap.docs.map((d) => [d.id, d.data() as ConsultantDoc]));

  const completed = reviews.filter((r) => COMPLETED_STATUSES.has(r.status) && r.report);
  const avgTurnaroundDays =
    completed.length === 0
      ? 0
      : completed.reduce((sum, r) => {
          const days = (r.report!.submittedAt.toDate().getTime() - r.createdAt.toDate().getTime()) / 86_400_000;
          return sum + days;
        }, 0) / completed.length;
  const totalCommission = reviews.reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0);

  const consultantStats = new Map<
    string,
    { name: string; caseCount: number; completedCount: number; fees: number; commission: number }
  >();
  for (const r of reviews) {
    if (!r.consultantId) continue;
    const entry = consultantStats.get(r.consultantId) ?? {
      name: consultants.get(r.consultantId)?.name ?? "Unknown",
      caseCount: 0,
      completedCount: 0,
      fees: 0,
      commission: 0,
    };
    entry.caseCount += 1;
    if (COMPLETED_STATUSES.has(r.status)) entry.completedCount += 1;
    if (r.proposal) entry.fees += r.proposal.estimatedTotal;
    entry.commission += r.commissionAmount ?? 0;
    consultantStats.set(r.consultantId, entry);
  }

  const recentSubmitted = reviews
    .filter((r) => r.report)
    .sort((a, b) => b.report!.submittedAt.toDate().getTime() - a.report!.submittedAt.toDate().getTime())
    .slice(0, 20);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Expert Reviews</h1>
      <p className="mt-1 text-navy-600">Marketplace analytics across every consultant and case.</p>

      <div className="mt-6">
        <AdminSubNav active="/admin/expert-reviews" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total requests" value={String(reviews.length)} />
        <StatCard label="Completed" value={String(completed.length)} />
        <StatCard label="Avg turnaround" value={`${avgTurnaroundDays.toFixed(1)}d`} />
        <StatCard label="Commission revenue" value={`€${totalCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Consultant performance</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-3">Consultant</th>
                <th className="px-4 py-3">Cases</th>
                <th className="px-4 py-3">Completion rate</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Consultant fees</th>
                <th className="px-4 py-3">Complyra commission</th>
              </tr>
            </thead>
            <tbody>
              {consultantStats.size === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-navy-500">
                    No cases yet.
                  </td>
                </tr>
              ) : (
                Array.from(consultantStats.entries()).map(([id, stats]) => (
                  <tr key={id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-navy-900">{stats.name}</td>
                    <td className="px-4 py-3 text-navy-500">{stats.caseCount}</td>
                    <td className="px-4 py-3 text-navy-500">
                      {stats.caseCount === 0 ? "—" : `${Math.round((stats.completedCount / stats.caseCount) * 100)}%`}
                    </td>
                    <td className="px-4 py-3 text-navy-500">
                      {(consultants.get(id)?.ratingCount ?? 0) > 0
                        ? `${consultants.get(id)!.ratingAverage.toFixed(1)} (${consultants.get(id)!.ratingCount})`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-navy-500">€{stats.fees.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-3 text-navy-500">€{stats.commission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Recent reviews</h2>
        <div className="mt-3 space-y-3">
          {recentSubmitted.length === 0 ? (
            <p className="text-sm text-navy-500">No reviews submitted yet.</p>
          ) : (
            recentSubmitted.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-surface p-4">
                <Link href={`/admin/expert-reviews/${r.id}`} className="hover:text-accent">
                  <p className="text-sm font-medium text-navy-900">
                    {consultants.get(r.consultantId ?? "")?.name ?? "Unknown consultant"}
                  </p>
                  <p className="mt-0.5 text-xs text-navy-500">
                    {r.report!.submittedAt.toDate().toLocaleDateString()}
                    {r.rating && ` · Rated ${r.rating.stars}/5`}
                    {r.flaggedForQualityReview && <span className="ml-2 font-semibold text-danger">Flagged</span>}
                  </p>
                </Link>
                <FlagReviewButton reviewId={r.id} flagged={r.flaggedForQualityReview} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-5">
      <p className="text-xs font-medium text-navy-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-navy-900">{value}</p>
    </div>
  );
}
