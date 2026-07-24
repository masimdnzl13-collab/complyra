import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { LeadsTable } from "@/components/admin/leads-table";
import { LeadCsvImportForm } from "@/components/admin/lead-csv-import-form";
import { serializeLeadDoc } from "@/lib/leads/serialize";
import { LEAD_SCORE_HIGH_THRESHOLD } from "@/lib/leads/constants";

export const metadata = constructMetadata({
  title: "Leads",
  path: "/admin/leads",
  noIndex: true,
});

export default async function AdminLeadsPage() {
  const admin = await getCurrentSuperAdmin();
  if (!admin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">403 — Forbidden</h1>
        <p className="mt-2 text-navy-600">This page is only available to the platform superadmin.</p>
      </div>
    );
  }

  const db = getAdminFirestore();
  const snap = await db.collection(firestorePaths.discoveredLeads()).get();
  const leads = snap.docs.map(serializeLeadDoc);

  const todayKey = new Date().toISOString().slice(0, 10);
  const addedToday = leads.filter((l) => l.discoveredAt.slice(0, 10) === todayKey).length;
  const scored = leads.filter((l) => l.aiUsageScore !== null);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, l) => s + (l.aiUsageScore ?? 0), 0) / scored.length) : null;
  const highPriorityCount = leads.filter((l) => (l.aiUsageScore ?? 0) >= LEAD_SCORE_HIGH_THRESHOLD).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Lead Discovery</h1>
      <p className="mt-1 text-navy-600">{leads.length} candidate companies tracked.</p>

      <div className="mt-6">
        <AdminSubNav active="/admin/leads" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">Total leads</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">Added today</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{addedToday}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">Average AI usage score</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{avgScore !== null ? avgScore : "N/A"}</p>
          <p className="mt-2 text-xs text-navy-500">{scored.length} scored so far</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-surface p-5">
          <p className="text-xs font-medium text-navy-500">High priority (70+)</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{highPriorityCount}</p>
        </div>
      </div>

      <div className="mt-8">
        <LeadCsvImportForm />
      </div>

      <div className="mt-8">
        <LeadsTable leads={leads} />
      </div>
    </div>
  );
}
