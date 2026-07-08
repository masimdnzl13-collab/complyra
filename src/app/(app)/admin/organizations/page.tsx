import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  firestorePaths,
  type AiSystemDoc,
  type AuditLogEntryDoc,
  type OrganizationDoc,
  type SubscriptionStatus,
  type UserDoc,
} from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans } from "@/config/site";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";

export const metadata = constructMetadata({
  title: "Organizations",
  path: "/admin/organizations",
  noIndex: true,
});

const PAGE_SIZE = 50;

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-success/10 text-success",
  trialing: "bg-accent/10 text-accent",
  past_due: "bg-danger/10 text-danger",
  cancelled: "bg-navy-100 text-navy-500",
};

interface PageProps {
  searchParams: { page?: string; plan?: string; status?: string; q?: string };
}

export default async function AdminOrganizationsPage({ searchParams }: PageProps) {
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
  const orgsSnap = await db.collection(firestorePaths.organizations()).get();
  let organizations = orgsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as OrganizationDoc) }))
    .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

  if (searchParams.plan) {
    organizations = organizations.filter((o) => o.subscription.planId === searchParams.plan);
  }
  if (searchParams.status) {
    organizations = organizations.filter((o) => o.subscription.status === searchParams.status);
  }
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    organizations = organizations.filter((o) => o.companyName.toLowerCase().includes(q));
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const totalPages = Math.max(1, Math.ceil(organizations.length / PAGE_SIZE));
  const pageItems = organizations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rows = await Promise.all(
    pageItems.map(async (org) => {
      const [ownerSnap, systemsSnap, lastActivitySnap] = await Promise.all([
        db.collection(firestorePaths.users()).where("organizationId", "==", org.id).where("role", "==", "owner").limit(1).get(),
        db.collection(firestorePaths.aiSystems(org.id)).get(),
        db.collection(firestorePaths.auditLog(org.id)).orderBy("timestamp", "desc").limit(1).get(),
      ]);
      const owner = ownerSnap.docs[0]?.data() as UserDoc | undefined;
      const systems = systemsSnap.docs.map((d) => d.data() as AiSystemDoc).filter((s) => s.status !== "retired");
      const lastActivity = lastActivitySnap.docs[0]?.data() as AuditLogEntryDoc | undefined;
      return { org, ownerEmail: owner?.email ?? "—", systemCount: systems.length, lastActivity: lastActivity?.timestamp ?? null };
    })
  );

  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { plan: searchParams.plan, status: searchParams.status, q: searchParams.q, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/admin/organizations${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Organizations</h1>
      <p className="mt-1 text-navy-600">{organizations.length} total.</p>

      <div className="mt-6">
        <AdminSubNav active="/admin/organizations" />
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/admin/organizations">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-navy-500">Search by name</span>
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Company name"
            className="rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-navy-500">Plan</span>
          <select name="plan" defaultValue={searchParams.plan ?? ""} className="rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900">
            <option value="">All plans</option>
            {pricingPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-navy-500">Status</span>
          <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past due</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          Filter
        </button>
        {(searchParams.plan || searchParams.status || searchParams.q) && (
          <Link href="/admin/organizations" className="text-xs font-medium text-navy-500 hover:text-navy-900">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Systems</th>
              <th className="px-4 py-3">Last activity</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy-500">
                  No organizations match these filters.
                </td>
              </tr>
            ) : (
              rows.map(({ org, ownerEmail, systemCount, lastActivity }) => {
                const plan = pricingPlans.find((p) => p.id === org.subscription.planId);
                return (
                  <tr key={org.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-navy-900">
                      {org.companyName}
                      {org.suspended && <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">Suspended</span>}
                    </td>
                    <td className="px-4 py-3 text-navy-600">{ownerEmail}</td>
                    <td className="px-4 py-3 text-navy-600">{plan?.name ?? org.subscription.planId}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[org.subscription.status]}`}>
                        {org.subscription.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy-500">{systemCount}</td>
                    <td className="px-4 py-3 text-navy-500">{lastActivity ? lastActivity.toDate().toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/organizations/${org.id}`} className="text-xs font-medium text-accent hover:text-accent-600">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-navy-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildQuery({ page: String(page - 1) })} className="rounded-md border border-navy-200 px-3 py-1.5 hover:bg-navy-50">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildQuery({ page: String(page + 1) })} className="rounded-md border border-navy-200 px-3 py-1.5 hover:bg-navy-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
