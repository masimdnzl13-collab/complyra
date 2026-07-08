import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { SystemWizard } from "@/components/ai-systems/system-wizard";
import type { AiSystemInput } from "@/lib/ai-systems/validate";

export const metadata = constructMetadata({
  title: "Edit AI system",
  path: "/ai-systems",
  noIndex: true,
});

interface EditPageProps {
  params: { id: string };
}

export default async function EditAiSystemPage({ params }: EditPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "owner") redirect(`/ai-systems/${params.id}`);

  const orgId = user.userDoc.organizationId;
  const snap = await getAdminFirestore().doc(firestorePaths.aiSystem(orgId, params.id)).get();
  if (!snap.exists) notFound();
  const system = snap.data() as AiSystemDoc;

  const initialData: AiSystemInput = {
    name: system.name,
    description: system.description,
    role: system.role,
    vendor: system.vendor,
    businessArea: system.businessArea,
    purpose: system.purpose,
    dataTypes: system.dataTypes,
    affectedGroups: system.affectedGroups,
    decisionMakingRole: system.decisionMakingRole,
    interactsWithPeople: system.interactsWithPeople,
    generatesSyntheticContent: system.generatesSyntheticContent,
    infersEmotionOrBehavior: system.infersEmotionOrBehavior,
  };

  return <SystemWizard mode="edit" systemId={params.id} initialData={initialData} />;
}
