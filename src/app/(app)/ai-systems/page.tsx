import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { EmptyState } from "@/components/app/empty-state";
import { Zap } from "lucide-react";

export const metadata = constructMetadata({
  title: "AI Systems",
  path: "/ai-systems",
  noIndex: true,
});

const ROLE_LABELS: Record<AiSystemDoc["role"], string> = {
  provider: "Provider",
  deployer: "Deployer",
};

const BUSINESS_AREA_LABELS: Record<AiSystemDoc["businessArea"], string> = {
  hr: "HR",
  customer_service: "Customer service",
  marketing_content: "Marketing / content",
  finance_credit: "Finance / credit",
  product_feature: "Product feature",
  operations: "Operations",
  other: "Other",
};

const STATUS_STYLES: Record<AiSystemDoc["status"], string> = {
  active: "bg-success/10 text-success",
  planned: "bg-accent/10 text-accent-700",
  inactive: "bg-warning/10 text-warning",
  retired: "bg-navy-100 text-navy-500",
};

const STATUS_LABELS: Record<AiSystemDoc["status"], string> = {
  active: "Active",
  planned: "Planned",
  inactive: "Inactive",
  retired: "Archived",
};

interface AiSystemsPageProps {
  searchParams: { view?: string };
}

export default async function AiSystemsPage({ searchParams }: AiSystemsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const snapshot = await getAdminFirestore()
    .collection(firestorePaths.aiSystems(orgId))
    .orderBy("createdAt", "desc")
    .get();

  const allSystems = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as AiSystemDoc) }));
  const showArchived = searchParams.view === "archived";
  const activeSystems = allSystems.filter((s) => s.status !== "retired");
  const archivedSystems = allSystems.filter((s) => s.status === "retired");
  const systems = showArchived ? archivedSystems : activeSystems;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">AI Systems</h1>
        {allSystems.length > 0 && (
          <Link
            href="/ai-systems/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
          >
            Add a system
          </Link>
        )}
      </div>

      {allSystems.length > 0 && (
        <div className="mt-6 flex gap-2 border-b border-navy-100">
          <Link
            href="/ai-systems"
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              !showArchived ? "border-accent text-navy-900" : "border-transparent text-navy-500 hover:text-navy-900"
            }`}
          >
            Active ({activeSystems.length})
          </Link>
          <Link
            href="/ai-systems?view=archived"
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${
              showArchived ? "border-accent text-navy-900" : "border-transparent text-navy-500 hover:text-navy-900"
            }`}
          >
            Archived ({archivedSystems.length})
          </Link>
        </div>
      )}

      {systems.length === 0 ? (
        showArchived ? (
          <div className="mt-10 rounded-xl border border-navy-100 bg-navy-50 p-10 text-center">
            <h2 className="text-lg font-semibold text-navy-900">No archived systems</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-navy-600">
              Systems you archive stay here for your records but stop counting toward your plan&apos;s quota.
            </p>
          </div>
        ) : (
          <EmptyState
            icon={Zap}
            title="Your inventory is empty"
            description="Building your AI inventory is the first, non-negotiable step toward EU AI Act compliance — everything else, from risk classification to generated documents, builds on it."
            action={{ label: "Add your first AI system", href: "/ai-systems/new" }}
          />
        )
      ) : (
        <div className="mt-8 space-y-3">
          {systems.map((system) => (
            <Link
              key={system.id}
              href={`/ai-systems/${system.id}`}
              className="block rounded-xl border border-navy-100 bg-surface p-5 transition-colors hover:border-navy-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-navy-900">{system.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600">
                    {ROLE_LABELS[system.role]}
                  </span>
                  <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600">
                    {BUSINESS_AREA_LABELS[system.businessArea]}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[system.status]}`}>
                    {STATUS_LABELS[system.status]}
                  </span>
                  <span className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-500">
                    {system.assessmentStatus === "assessed" ? "Assessed" : "Not assessed"}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-navy-600">{system.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
