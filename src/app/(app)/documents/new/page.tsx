import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc, type AssessmentDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { DocumentGeneratorForm, type AssessmentOption } from "@/components/documents/document-generator-form";

export const metadata = constructMetadata({
  title: "Generate a document",
  path: "/documents",
  noIndex: true,
});

export default async function NewDocumentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "owner") redirect("/documents");

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const assessmentsSnap = await db
    .collection(firestorePaths.assessments(orgId))
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .get();

  const options: AssessmentOption[] = [];
  for (const doc of assessmentsSnap.docs) {
    const assessment = doc.data() as AssessmentDoc;
    const systemSnap = await db.doc(firestorePaths.aiSystem(orgId, assessment.aiSystemId)).get();
    if (!systemSnap.exists) continue;
    const system = systemSnap.data() as AiSystemDoc;
    options.push({ id: doc.id, assessment, systemName: system.name, systemRole: system.role });
  }

  return <DocumentGeneratorForm assessments={options} />;
}
