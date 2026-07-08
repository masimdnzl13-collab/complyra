import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { constructMetadata } from "@/lib/construct-metadata";
import { SystemWizard } from "@/components/ai-systems/system-wizard";

export const metadata = constructMetadata({
  title: "Add an AI system",
  path: "/ai-systems/new",
  noIndex: true,
});

export default async function NewAiSystemPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "owner") redirect("/ai-systems");

  return <SystemWizard mode="create" />;
}
