import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ComplianceDocumentDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { DOCUMENT_TEMPLATES } from "@/lib/documents/templates";
import { DocumentEditor } from "@/components/documents/document-editor";

export const metadata = constructMetadata({
  title: "Document",
  path: "/documents",
  noIndex: true,
});

interface DocumentDetailPageProps {
  params: { id: string };
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const snap = await getAdminFirestore().doc(firestorePaths.document(orgId, params.id)).get();
  if (!snap.exists) notFound();
  const document = snap.data() as ComplianceDocumentDoc;

  return (
    <DocumentEditor
      documentId={params.id}
      type={document.type}
      status={document.status}
      version={document.version}
      fixedFields={document.fixedFields}
      sections={document.sections}
      templateLabel={DOCUMENT_TEMPLATES[document.type].label}
      isOwner={user.userDoc.role === "owner"}
    />
  );
}
