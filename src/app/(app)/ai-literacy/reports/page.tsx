import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type TrainingRecordDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { ROLE_LABELS, getModulesForRole } from "@/lib/ai-literacy/modules";

export const metadata = constructMetadata({ title: "AI Literacy Reports", path: "/ai-literacy/reports", noIndex: true });

const CERTIFICATE_VALIDITY_DAYS = 365;

export default async function AiLiteracyReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "owner") redirect("/ai-literacy");

  const orgId = user.userDoc.organizationId;
  const snapshot = await getAdminFirestore().collection(firestorePaths.trainingRecords(orgId)).get();
  const records = snapshot.docs.map((d) => d.data() as TrainingRecordDoc);

  const now = Date.now();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">AI Literacy Reports</h1>
        <a
          href="/api/ai-literacy/report/csv"
          className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
        >
          Export CSV
        </a>
      </div>

      {records.length === 0 ? (
        <p className="mt-10 text-sm text-navy-600">No one has started training yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-navy-100 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100">
                <th className="px-5 py-3 font-medium text-navy-500">Employee</th>
                <th className="px-5 py-3 font-medium text-navy-500">Role</th>
                <th className="px-5 py-3 font-medium text-navy-500">Status</th>
                <th className="px-5 py-3 font-medium text-navy-500">Modules</th>
                <th className="px-5 py-3 font-medium text-navy-500">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {records.map((r) => {
                const required = getModulesForRole(r.role);
                const completedCount = required.filter((m) => r.moduleProgress[m.id]?.passed).length;
                const status = r.completedAt ? "Completed" : completedCount > 0 ? "In progress" : "Not started";
                const validUntil = r.completedAt
                  ? new Date(r.completedAt.toDate().getTime() + CERTIFICATE_VALIDITY_DAYS * 24 * 60 * 60 * 1000)
                  : null;
                const certExpired = validUntil ? validUntil.getTime() < now : false;

                return (
                  <tr key={r.userId}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-navy-900">{r.userName}</p>
                      <p className="text-xs text-navy-500">{r.userEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-navy-600">{ROLE_LABELS[r.role]}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          status === "Completed"
                            ? "bg-success/10 text-success"
                            : status === "In progress"
                              ? "bg-accent/10 text-accent-700"
                              : "bg-navy-100 text-navy-500"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-navy-600">
                      {completedCount} / {required.length}
                    </td>
                    <td className="px-5 py-3 text-navy-600">
                      {!r.completedAt ? "—" : certExpired ? "Renewal needed" : `Valid until ${validUntil!.toISOString().slice(0, 10)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
