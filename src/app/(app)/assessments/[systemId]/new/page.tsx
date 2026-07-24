import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { AssessmentForm } from "@/components/risk-assessment/assessment-form";

export const metadata = constructMetadata({
  title: "Assess risk",
  path: "/assessments",
  noIndex: true,
});

interface NewAssessmentPageProps {
  params: { systemId: string };
}

export default async function NewAssessmentPage({ params }: NewAssessmentPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "owner") redirect(`/ai-systems/${params.systemId}`);

  const orgId = user.userDoc.organizationId;
  const snap = await getAdminFirestore().doc(firestorePaths.aiSystem(orgId, params.systemId)).get();
  if (!snap.exists) notFound();
  const system = snap.data() as AiSystemDoc;

  const systemSummary = {
    name: system.name,
    description: system.description,
    vendor: system.vendor,
  };

  return <AssessmentForm system={systemSummary} systemId={params.systemId} />;
}
