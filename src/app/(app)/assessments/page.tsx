import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";

export const metadata = constructMetadata({
  title: "Risk Assessments",
  path: "/assessments",
  noIndex: true,
});

export default async function AssessmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const snapshot = await getAdminFirestore()
    .collection(firestorePaths.aiSystems(orgId))
    .orderBy("createdAt", "desc")
    .get();
  const systems = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as AiSystemDoc) }));
  const isOwner = user.userDoc.role === "owner";

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Risk Assessments</h1>
      <p className="mt-2 text-navy-600">
        Determine which EU AI Act obligations apply to each system in your inventory.
      </p>

      {systems.length === 0 ? (
        <div className="mt-10 rounded-xl border border-navy-100 bg-navy-50 p-10 text-center">
          <h2 className="text-lg font-semibold text-navy-900">No AI systems yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy-600">
            Add a system to your inventory before you can run a risk assessment.
          </p>
          <Link
            href="/ai-systems/new"
            className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
          >
            Add your first AI system
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {systems.map((system) => (
            <div
              key={system.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy-100 bg-surface p-5"
            >
              <div>
                <p className="font-semibold text-navy-900">{system.name}</p>
                <p className="mt-1 text-sm text-navy-600">{system.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    system.assessmentStatus === "assessed"
                      ? "bg-success/10 text-success"
                      : "bg-navy-100 text-navy-500"
                  }`}
                >
                  {system.assessmentStatus === "assessed" ? "Assessed" : "Not assessed"}
                </span>
                {system.assessmentStatus === "assessed" ? (
                  <Link
                    href={`/ai-systems/${system.id}`}
                    className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
                  >
                    View result
                  </Link>
                ) : isOwner ? (
                  <Link
                    href={`/assessments/${system.id}/new`}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
                  >
                    Assess risk
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
