import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { ChatbotDisclosureWizard } from "@/components/article50/chatbot-disclosure-wizard";

export const metadata = constructMetadata({ title: "Create disclosure notice", path: "/article-50/chatbot", noIndex: true });

interface PageProps {
  params: { systemId: string };
}

export default async function NewChatbotDisclosurePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "owner") redirect("/article-50/chatbot");

  const orgId = user.userDoc.organizationId;
  const snap = await getAdminFirestore().doc(firestorePaths.aiSystem(orgId, params.systemId)).get();
  if (!snap.exists) notFound();
  const system = snap.data() as AiSystemDoc;

  return <ChatbotDisclosureWizard systemId={params.systemId} systemName={system.name} />;
}
