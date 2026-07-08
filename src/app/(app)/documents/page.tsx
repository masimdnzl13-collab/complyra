import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ComplianceDocumentDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { DOCUMENT_TEMPLATES } from "@/lib/documents/templates";

export const metadata = constructMetadata({
  title: "Documents",
  path: "/documents",
  noIndex: true,
});

const STATUS_STYLES: Record<ComplianceDocumentDoc["status"], string> = {
  draft: "bg-navy-100 text-navy-500",
  reviewed: "bg-success/10 text-success",
};

const STATUS_LABELS: Record<ComplianceDocumentDoc["status"], string> = {
  draft: "Draft",
  reviewed: "Reviewed",
};

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const snapshot = await getAdminFirestore()
    .collection(firestorePaths.documents(orgId))
    .where("isCurrent", "==", true)
    .orderBy("updatedAt", "desc")
    .get();
  const documents = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ComplianceDocumentDoc) }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Documents</h1>
        <Link
          href="/documents/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
        >
          Generate document
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="mt-10 rounded-xl border border-navy-100 bg-navy-50 p-10 text-center">
          <h2 className="text-lg font-semibold text-navy-900">No documents yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy-600">
            Generate compliance documentation from any risk assessment you&apos;ve run.
          </p>
          <Link
            href="/documents/new"
            className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
          >
            Generate your first document
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/documents/${document.id}`}
              className="block rounded-xl border border-navy-100 bg-surface p-5 transition-colors hover:border-navy-200"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-navy-900">{DOCUMENT_TEMPLATES[document.type].label}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[document.status]}`}>
                  {STATUS_LABELS[document.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-navy-600">{document.fixedFields.systemName}</p>
              <p className="mt-3 text-xs text-navy-400">
                Created {document.createdAt.toDate().toLocaleDateString()} · v{document.version}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
