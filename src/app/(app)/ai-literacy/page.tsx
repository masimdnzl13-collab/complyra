import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type TrainingRecordDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { ROLE_LABELS, getModulesForRole } from "@/lib/ai-literacy/modules";

export const metadata = constructMetadata({ title: "AI Literacy", path: "/ai-literacy", noIndex: true });

export default async function AiLiteracyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const recordSnap = await db.doc(firestorePaths.trainingRecord(orgId, user.uid)).get();
  const record = recordSnap.exists ? (recordSnap.data() as TrainingRecordDoc) : null;

  let orgStat: { completed: number; total: number } | null = null;
  if (user.userDoc.role === "owner") {
    const allSnap = await db.collection(firestorePaths.trainingRecords(orgId)).get();
    const all = allSnap.docs.map((d) => d.data() as TrainingRecordDoc);
    orgStat = { completed: all.filter((r) => r.completedAt).length, total: all.length };
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">AI Literacy</h1>
      <p className="mt-2 text-navy-600">
        Article 4 of the EU AI Act requires staff to have a sufficient level of AI literacy for their role.
        This training satisfies that obligation — about 30–45 minutes, role-based, with a certificate at the end.
      </p>

      {orgStat && (
        <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-navy-900">
              {orgStat.completed} out of {orgStat.total} employees completed
              {orgStat.total > 0 && ` — ${Math.round((orgStat.completed / orgStat.total) * 100)}%`}
            </p>
            <Link href="/ai-literacy/reports" className="text-sm font-medium text-accent hover:text-accent-600">
              View report →
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-navy-100 bg-surface p-8 shadow-sm text-center">
        {!record ? (
          <>
            <h2 className="text-lg font-semibold text-navy-900">Start your AI literacy training</h2>
            <p className="mt-2 text-sm text-navy-600">Five common modules, plus one for your role. About 30–45 minutes total.</p>
            <Link
              href="/ai-literacy/role"
              className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              Start training
            </Link>
          </>
        ) : record.completedAt ? (
          <>
            <h2 className="text-lg font-semibold text-success">Training complete</h2>
            <p className="mt-2 text-sm text-navy-600">
              Certified as {ROLE_LABELS[record.role]} on {record.completedAt.toDate().toISOString().slice(0, 10)}.
            </p>
            <a
              href={`/api/ai-literacy/certificate/${user.uid}/pdf`}
              className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              Download certificate
            </a>
          </>
        ) : (
          <>
            {(() => {
              const required = getModulesForRole(record.role);
              const passedCount = required.filter((m) => record.moduleProgress[m.id]?.passed).length;
              const nextModule = required.find((m) => !record.moduleProgress[m.id]?.passed);
              return (
                <>
                  <h2 className="text-lg font-semibold text-navy-900">
                    {passedCount} of {required.length} modules complete
                  </h2>
                  <p className="mt-2 text-sm text-navy-600">Role: {ROLE_LABELS[record.role]}</p>
                  {nextModule && (
                    <Link
                      href={`/ai-literacy/modules/${nextModule.id}`}
                      className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
                    >
                      Continue: {nextModule.title}
                    </Link>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
