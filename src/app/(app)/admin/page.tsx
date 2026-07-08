import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type CronRunDoc, type MrrSnapshotDoc, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { calculateMrr } from "@/lib/billing/mrr";
import { getCurrentMonthKey } from "@/lib/usage/monthly-quota";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";

export const metadata = constructMetadata({
  title: "Admin",
  path: "/admin",
  noIndex: true,
});

export default async function AdminHomePage() {
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
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 3_600_000);
  const currentMonthKey = getCurrentMonthKey(now);
  const thirtyDaysAgoKey = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);

  const [orgsSnap, recentRunsSnap, mrrSnapshot30dAgo] = await Promise.all([
    db.collection(firestorePaths.organizations()).get(),
    db.collection(firestorePaths.cronRuns()).orderBy("startedAt", "desc").limit(200).get(),
    db.doc(firestorePaths.mrrSnapshot(thirtyDaysAgoKey)).get(),
  ]);

  const organizations = orgsSnap.docs.map((d) => d.data() as OrganizationDoc);
  const { mrr, activeCount, planCounts } = calculateMrr(organizations);

  const priorMrr = (mrrSnapshot30dAgo.data() as MrrSnapshotDoc | undefined)?.mrr;
  const mrrChangePct = priorMrr && priorMrr > 0 ? Math.round(((mrr - priorMrr) / priorMrr) * 100) : null;

  const newSignupsThisMonth = organizations.filter((o) => o.createdAt.toDate().toISOString().slice(0, 7) === currentMonthKey).length;
  const cancelledCount = organizations.filter((o) => o.subscription.status === "cancelled").length;
  const churnRate = organizations.length > 0 ? Math.round((cancelledCount / organizations.length) * 100) : 0;

  const assessmentsThisMonth = organizations.reduce((s, o) => s + o.usage.assessmentsThisMonth, 0);
  const documentsThisMonth = organizations.reduce((s, o) => s + o.usage.documentsGeneratedThisMonth, 0);
  const expertReviewsThisMonth = organizations.reduce((s, o) => s + o.usage.expertReviewsThisMonth, 0);

  const last24hRuns = recentRunsSnap.docs.map((d) => d.data() as CronRunDoc).filter((r) => r.startedAt.toDate() >= oneDayAgo);
  const failedRuns = last24hRuns.filter((r) => r.status === "failed").length;
  const emailsSentToday = last24hRuns.reduce((s, r) => s + r.emailsSent, 0);
  const emailsFailedToday = last24hRuns.reduce((s, r) => s + r.emailsFailed, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Admin</h1>
      <p className="mt-1 text-navy-600">Platform health at a glance.</p>

      <div className="mt-6">
        <AdminSubNav active="/admin" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">Active subscriptions</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">
            {activeCount}
            <span className="ml-2 text-sm font-normal text-navy-500">
              €{mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })} MRR
              {mrrChangePct !== null && (
                <span className={mrrChangePct >= 0 ? "text-success" : "text-danger"}>
                  {" "}
                  ({mrrChangePct >= 0 ? "↑" : "↓"} {Math.abs(mrrChangePct)}%)
                </span>
              )}
            </span>
          </p>
          <p className="mt-2 text-xs text-navy-500">
            {planCounts.starter} Starter · {planCounts.growth} Growth · {planCounts.scale} Scale
          </p>
        </div>

        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">Usage this month</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{assessmentsThisMonth + documentsThisMonth + expertReviewsThisMonth}</p>
          <p className="mt-2 text-xs text-navy-500">
            {assessmentsThisMonth} assessments · {documentsThisMonth} documents · {expertReviewsThisMonth} expert reviews
          </p>
        </div>

        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">Cron jobs (24h)</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">
            {last24hRuns.length} run{last24hRuns.length === 1 ? "" : "s"}
          </p>
          <p className={`mt-2 text-xs ${failedRuns > 0 ? "font-semibold text-danger" : "text-success"}`}>
            {failedRuns > 0 ? `${failedRuns} error${failedRuns === 1 ? "" : "s"}` : "All passed"}
          </p>
        </div>

        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">Email (last 24h)</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{emailsSentToday} sent</p>
          <p className={`mt-2 text-xs ${emailsFailedToday > 0 ? "font-semibold text-danger" : "text-navy-500"}`}>
            {emailsFailedToday} failed
          </p>
        </div>

        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">Organizations</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{organizations.length}</p>
          <p className="mt-2 text-xs text-navy-500">
            {newSignupsThisMonth} new this month · {churnRate}% cancelled
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard href="/admin/organizations" title="Manage Organizations" description="Search, filter, and support every org." />
        <AdminCard href="/admin/analytics" title="Subscription Analytics" description="MRR, plan mix, trials, payment health." />
        <AdminCard href="/admin/consultants" title="Consultant Network" description="Profiles, approvals, and cases." />
        <AdminCard href="/admin/content" title="Content & Regulations" description="Regulatory updates and announcements." />
      </div>
    </div>
  );
}

function AdminCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-xl border border-navy-100 bg-surface p-5 hover:bg-navy-50">
      <p className="text-sm font-semibold text-navy-900">{title}</p>
      <p className="mt-1 text-xs text-navy-500">{description}</p>
    </Link>
  );
}
