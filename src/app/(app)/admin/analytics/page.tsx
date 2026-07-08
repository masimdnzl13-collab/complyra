import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type MrrSnapshotDoc, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans } from "@/config/site";
import { calculateMrr } from "@/lib/billing/mrr";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { MrrTrendChart, PlanBreakdownPie } from "@/components/admin/analytics-charts";

export const metadata = constructMetadata({
  title: "Analytics",
  path: "/admin/analytics",
  noIndex: true,
});

export default async function AdminAnalyticsPage() {
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
  const [orgsSnap, snapshotsSnap] = await Promise.all([
    db.collection(firestorePaths.organizations()).get(),
    db.collection(firestorePaths.mrrSnapshots()).orderBy("date", "asc").limit(400).get(),
  ]);

  const organizations = orgsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as OrganizationDoc) }));
  const { mrr, activeCount, planCounts } = calculateMrr(organizations);

  const trendData = snapshotsSnap.docs.map((d) => {
    const snap = d.data() as MrrSnapshotDoc;
    return { date: snap.date, mrr: snap.mrr };
  });

  const pieData = pricingPlans
    .filter((p) => p.id !== "free")
    .map((p) => ({ name: p.name, value: planCounts[p.id] ?? 0 }));

  const cancelledCount = organizations.filter((o) => o.subscription.status === "cancelled").length;
  const churnRate = organizations.length > 0 ? (cancelledCount / organizations.length) * 100 : 0;
  const arpu = activeCount > 0 ? mrr / activeCount : 0;
  // Classic SaaS approximation: LTV = ARPU / monthly churn rate. Not a real cohort-based LTV — there's no
  // subscription-length history to compute one from — flagged as an estimate in the label, not asserted as exact.
  const ltvEstimate = churnRate > 0 ? arpu / (churnRate / 100) : null;

  const trialingCount = organizations.filter((o) => o.subscription.trialStatus === "active").length;
  const convertedCount = organizations.filter((o) => o.subscription.trialStatus === "converted_to_paid").length;
  const expiredCount = organizations.filter((o) => o.subscription.trialStatus === "expired").length;
  const trialConversionRate = convertedCount + expiredCount > 0 ? (convertedCount / (convertedCount + expiredCount)) * 100 : null;

  const pastDueOrgs = organizations.filter((o) => o.subscription.status === "past_due");
  const payingOrgsCount = organizations.filter((o) => o.subscription.planId !== "free").length;
  const pastDueRate = payingOrgsCount > 0 ? (pastDueOrgs.length / payingOrgsCount) * 100 : 0;

  const detailedRows = organizations
    .filter((o) => o.subscription.planId !== "free")
    .map((o) => {
      const plan = pricingPlans.find((p) => p.id === o.subscription.planId);
      const isPaying = o.subscription.status !== "cancelled";
      const rowMrr = isPaying && plan ? (o.subscription.billingInterval === "year" ? plan.priceYearly / 12 : plan.price) : 0;
      return { org: o, plan, rowMrr };
    })
    .sort((a, b) => b.rowMrr - a.rowMrr);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Analytics</h1>
      <p className="mt-1 text-navy-600">Subscription and revenue analytics.</p>

      <div className="mt-6">
        <AdminSubNav active="/admin/analytics" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-navy-100 bg-surface p-6">
          <p className="text-xs font-medium text-navy-500">Current MRR</p>
          <p className="mt-1 text-3xl font-semibold text-navy-900">€{mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <div className="mt-4">
            <MrrTrendChart data={trendData} />
          </div>
        </div>

        <div className="rounded-xl border border-navy-100 bg-surface p-6">
          <p className="text-xs font-medium text-navy-500">Plan breakdown</p>
          <PlanBreakdownPie data={pieData} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Churn rate" value={`${churnRate.toFixed(1)}%`} sub={`${cancelledCount} cancelled`} />
        <StatCard label="LTV estimate" value={ltvEstimate ? `€${ltvEstimate.toFixed(0)}` : "—"} sub="ARPU ÷ churn rate" />
        <StatCard label="Trial conversion" value={trialConversionRate !== null ? `${trialConversionRate.toFixed(0)}%` : "—"} sub={`${trialingCount} currently trialing`} />
        <StatCard label="Past-due rate" value={`${pastDueRate.toFixed(1)}%`} sub={`${pastDueOrgs.length} orgs`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-navy-100 bg-surface p-6">
          <h2 className="text-sm font-semibold text-navy-900">Trial metrics</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-navy-500">Currently trialing</dt>
              <dd className="font-medium text-navy-900">{trialingCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy-500">Converted to paid (all-time)</dt>
              <dd className="font-medium text-navy-900">{convertedCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy-500">Expired without payment (all-time)</dt>
              <dd className="font-medium text-navy-900">{expiredCount}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-navy-100 bg-surface p-6">
          <h2 className="text-sm font-semibold text-navy-900">Past-due subscriptions</h2>
          {pastDueOrgs.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">None right now.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pastDueOrgs.map((o) => (
                <li key={o.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/organizations/${o.id}`} className="font-medium text-accent hover:text-accent-600">
                    {o.companyName}
                  </Link>
                  <span className="text-xs text-navy-500">
                    {o.subscription.pastDueSince ? o.subscription.pastDueSince.toDate().toLocaleDateString() : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">All paid subscriptions</h2>
          <a href="/api/admin/analytics/export" className="text-xs font-medium text-accent hover:text-accent-600">
            Export CSV
          </a>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">MRR</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next billing</th>
              </tr>
            </thead>
            <tbody>
              {detailedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-navy-500">
                    No paid subscriptions yet.
                  </td>
                </tr>
              ) : (
                detailedRows.map(({ org, plan, rowMrr }) => (
                  <tr key={org.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-navy-900">{org.companyName}</td>
                    <td className="px-4 py-3 text-navy-600">{plan?.name ?? org.subscription.planId}</td>
                    <td className="px-4 py-3 text-navy-600">€{rowMrr.toFixed(0)}</td>
                    <td className="px-4 py-3 text-navy-500">{org.subscription.status}</td>
                    <td className="px-4 py-3 text-navy-500">
                      {org.subscription.nextBillingDate ? org.subscription.nextBillingDate.toDate().toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-5">
      <p className="text-xs font-medium text-navy-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-navy-900">{value}</p>
      <p className="mt-1 text-xs text-navy-400">{sub}</p>
    </div>
  );
}
