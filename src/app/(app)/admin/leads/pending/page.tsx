import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { LeadsSubNav } from "@/components/admin/leads-sub-nav";
import { PendingLeadsTable } from "@/components/admin/pending-leads-table";
import { serializeLeadDoc } from "@/lib/leads/serialize";

export const metadata = constructMetadata({
  title: "Pending Review — Leads",
  path: "/admin/leads/pending",
  noIndex: true,
});

export default async function PendingLeadsPage() {
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
  const allLeads = snap.docs.map(serializeLeadDoc);
  const pendingLeads = allLeads
    .filter((l) => l.status === "pending_review")
    .sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt));

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Lead Discovery</h1>
      <p className="mt-1 text-navy-600">
        Candidates the auto-discovery cron found via web search — review the source before approving.
      </p>

      <div className="mt-6">
        <AdminSubNav active="/admin/leads" />
      </div>

      <LeadsSubNav active="pending" pendingCount={pendingLeads.length} />

      <PendingLeadsTable leads={pendingLeads} />
    </div>
  );
}
