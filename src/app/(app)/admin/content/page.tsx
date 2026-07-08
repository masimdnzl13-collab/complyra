import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type RegulatoryUpdateCategory, type RegulatoryUpdateDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { AddRegulatoryUpdateForm, DeleteRegulatoryUpdateButton } from "@/components/admin/regulatory-update-admin";
import { BroadcastForm } from "@/components/admin/broadcast-form";

export const metadata = constructMetadata({
  title: "Content & Regulations",
  path: "/admin/content",
  noIndex: true,
});

const CATEGORY_LABELS: Record<RegulatoryUpdateCategory, string> = {
  transparency: "Transparency",
  high_risk: "High-risk",
  prohibited: "Prohibited practices",
  general: "General",
};

export default async function AdminContentPage() {
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
  const snap = await db.collection(firestorePaths.regulatoryUpdates()).orderBy("createdAt", "desc").limit(50).get();
  const updates = snap.docs.map((d) => ({ id: d.id, ...(d.data() as RegulatoryUpdateDoc) }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Content & Regulations</h1>
      <p className="mt-1 text-navy-600">Regulatory updates and platform announcements.</p>

      <div className="mt-6">
        <AdminSubNav active="/admin/content" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <AddRegulatoryUpdateForm />
        <BroadcastForm />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Regulatory updates ({updates.length})</h2>
        <div className="mt-3 space-y-2">
          {updates.length === 0 ? (
            <p className="text-sm text-navy-500">None captured yet.</p>
          ) : (
            updates.map((u) => (
              <div key={u.id} className="rounded-xl border border-navy-100 bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy-500">
                    {CATEGORY_LABELS[u.category]}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-navy-400">{u.publishedAt.toDate().toLocaleDateString()}</span>
                    <DeleteRegulatoryUpdateButton id={u.id} />
                  </div>
                </div>
                <a href={u.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-navy-900 hover:text-accent">
                  {u.title}
                </a>
                <p className="mt-1 text-sm text-navy-600">{u.summary}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
