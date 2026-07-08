import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type CronJobName, type CronRunDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { TriggerCronButton } from "@/components/admin/trigger-cron-button";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { checkApiHealth } from "@/lib/admin/health-checks";

export const metadata = constructMetadata({
  title: "Automations",
  path: "/admin/automations",
  noIndex: true,
});

const KNOWN_JOBS: { jobName: CronJobName; label: string; schedule: string }[] = [
  { jobName: "billing-sweep", label: "Billing sweep", schedule: "Daily at 00:00 UTC" },
  { jobName: "deadline-reminders", label: "Deadline reminders", schedule: "Daily at 08:00 UTC" },
  { jobName: "regulatory-news", label: "Regulatory news", schedule: "Daily at 12:00 UTC (digest Fridays)" },
];

export default async function AdminAutomationsPage() {
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
  const [runsSnap, apiHealth, orgCount, consultantCount, reviewCount, updateCount, subscriberCount] = await Promise.all([
    db.collection(firestorePaths.cronRuns()).orderBy("startedAt", "desc").limit(50).get(),
    checkApiHealth(),
    db.collection(firestorePaths.organizations()).count().get(),
    db.collection(firestorePaths.consultants()).count().get(),
    db.collection(firestorePaths.expertReviews()).count().get(),
    db.collection(firestorePaths.regulatoryUpdates()).count().get(),
    db.collection(firestorePaths.newsletterSubscribers()).count().get(),
  ]);
  const runs = runsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as CronRunDoc) }));

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const todaysRuns = runs.filter((r) => r.startedAt.toDate() >= startOfToday);
  const emailsSentToday = todaysRuns.reduce((sum, r) => sum + r.emailsSent, 0);
  const emailsFailedToday = todaysRuns.reduce((sum, r) => sum + r.emailsFailed, 0);

  const collectionSizes = [
    { name: "Organizations", count: orgCount.data().count },
    { name: "Consultants", count: consultantCount.data().count },
    { name: "Expert reviews", count: reviewCount.data().count },
    { name: "Regulatory updates", count: updateCount.data().count },
    { name: "Newsletter subscribers", count: subscriberCount.data().count },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Automations</h1>
      <p className="mt-1 text-navy-600">Cron job history, email delivery, and manual controls.</p>

      <div className="mt-6">
        <AdminSubNav active="/admin/automations" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Emails sent today" value={String(emailsSentToday)} />
        <StatCard label="Emails failed today" value={String(emailsFailedToday)} />
        <StatCard label="Runs today" value={String(todaysRuns.length)} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Scheduled jobs</h2>
        <div className="mt-3 space-y-3">
          {KNOWN_JOBS.map((job) => (
            <div key={job.jobName} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-surface p-4">
              <div>
                <p className="text-sm font-semibold text-navy-900">{job.label}</p>
                <p className="text-xs text-navy-500">{job.schedule}</p>
              </div>
              <TriggerCronButton jobName={job.jobName} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">API health</h2>
          <div className="mt-3 space-y-2">
            {apiHealth.map((h) => (
              <div key={h.name} className="flex items-center justify-between rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm">
                <span className="text-navy-900">{h.name}</span>
                <span className={`flex items-center gap-1.5 text-xs ${h.ok ? "text-success" : "text-danger"}`}>
                  <span className={`h-2 w-2 rounded-full ${h.ok ? "bg-success" : "bg-danger"}`} />
                  {h.detail}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm">
              <span className="text-navy-900">Firestore</span>
              <span className="flex items-center gap-1.5 text-xs text-success">
                <span className="h-2 w-2 rounded-full bg-success" />
                Reachable
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Collection sizes</h2>
          <div className="mt-3 space-y-2">
            {collectionSizes.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm">
                <span className="text-navy-900">{c.name}</span>
                <span className="text-xs text-navy-500">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Cron job history</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Processed</th>
                <th className="px-4 py-3">Emails</th>
                <th className="px-4 py-3">Trigger</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-navy-500">
                    No cron runs recorded yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-navy-900">{run.jobName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          run.status === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy-500">{run.startedAt.toDate().toLocaleString()}</td>
                    <td className="px-4 py-3 text-navy-500">{run.durationMs}ms</td>
                    <td className="px-4 py-3 text-navy-500">{run.processedCount}</td>
                    <td className="px-4 py-3 text-navy-500">
                      {run.emailsSent} sent{run.emailsFailed > 0 ? ` / ${run.emailsFailed} failed` : ""}
                    </td>
                    <td className="px-4 py-3 text-navy-500">{run.triggeredBy}</td>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-5">
      <p className="text-xs font-medium text-navy-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-navy-900">{value}</p>
    </div>
  );
}
