import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc, type Article50Artifact } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";

export const metadata = constructMetadata({ title: "Chatbot Disclosure", path: "/article-50/chatbot", noIndex: true });

export default async function ChatbotDisclosurePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const [systemsSnap, artifactsSnap] = await Promise.all([
    db.collection(firestorePaths.aiSystems(orgId)).where("interactsWithPeople", "==", true).get(),
    db
      .collection(firestorePaths.article50Artifacts(orgId))
      .where("area", "==", "chatbot_disclosure")
      .where("isCurrent", "==", true)
      .get(),
  ]);

  const systems = systemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AiSystemDoc) }));
  const artifactBySystem = new Map(
    artifactsSnap.docs.map((d) => [(d.data() as Article50Artifact).aiSystemId, d.id])
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Chatbot / direct-interaction notice</h1>
      <p className="mt-2 text-navy-600">
        Article 50(1) requires telling people they&apos;re interacting with an AI system, not a human.
        {" "}Systems below are pulled from your AI inventory as ones that talk directly with people.
      </p>

      {systems.length === 0 ? (
        <div className="mt-10 rounded-xl border border-navy-100 bg-navy-50 p-10 text-center">
          <p className="text-sm text-navy-600">
            No AI systems in your inventory currently interact directly with people — nothing to do here yet.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {systems.map((system) => {
            const artifactId = artifactBySystem.get(system.id);
            return (
              <div
                key={system.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-surface p-5"
              >
                <div>
                  <p className="font-semibold text-navy-900">{system.name}</p>
                  <p className="mt-1 text-sm text-navy-600">{system.description}</p>
                </div>
                {artifactId ? (
                  <Link
                    href={`/article-50/artifacts/${artifactId}`}
                    className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
                  >
                    View notice
                  </Link>
                ) : (
                  <Link
                    href={`/article-50/chatbot/${system.id}/new`}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
                  >
                    Create disclosure notice
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
