import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ConsultantApprovalStatus, type ConsultantDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { InviteConsultantForm, ConsultantStatusActions } from "@/components/admin/consultant-admin-actions";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";

export const metadata = constructMetadata({
  title: "Consultant Network",
  path: "/admin/consultants",
  noIndex: true,
});

const STATUS_STYLES: Record<ConsultantApprovalStatus, string> = {
  pending_approval: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  active: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
};

export default async function AdminConsultantsPage() {
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

  const snap = await getAdminFirestore().collection(firestorePaths.consultants()).get();
  const consultants = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as ConsultantDoc) }))
    .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Consultant Network</h1>
      <p className="mt-1 text-navy-600">Invite, review, and manage the expert-review consultant pool.</p>

      <div className="mt-6">
        <AdminSubNav active="/admin/consultants" />
      </div>

      <div className="mt-2">
        <InviteConsultantForm />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Expertise</th>
              <th className="px-4 py-3">Languages</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Turnaround</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {consultants.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-navy-500">
                  No consultants invited yet.
                </td>
              </tr>
            ) : (
              consultants.map((c) => (
                <tr key={c.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy-900">
                    <Link href={`/admin/consultants/${c.id}`} className="hover:text-accent">
                      {c.name || "(incomplete)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-600">{c.email}</td>
                  <td className="px-4 py-3 text-navy-500">{c.expertiseAreas?.join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-navy-500">{c.languages?.join(", ").toUpperCase() || "—"}</td>
                  <td className="px-4 py-3 text-navy-500">{c.hourlyRate ? `€${c.hourlyRate}/hr` : "—"}</td>
                  <td className="px-4 py-3 text-navy-500">{c.averageTurnaround ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-500">
                    {c.ratingCount > 0 ? `${c.ratingAverage.toFixed(1)} (${c.ratingCount})` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[c.approvalStatus]}`}>
                      {c.approvalStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ConsultantStatusActions consultantId={c.id} status={c.approvalStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
