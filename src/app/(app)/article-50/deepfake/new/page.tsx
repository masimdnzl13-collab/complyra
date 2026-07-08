import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { constructMetadata } from "@/lib/construct-metadata";
import { DeepfakeWizard } from "@/components/article50/deepfake-wizard";

export const metadata = constructMetadata({ title: "Deepfake disclosure", path: "/article-50/deepfake", noIndex: true });

export default async function NewDeepfakePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "owner") redirect("/article-50");

  return <DeepfakeWizard />;
}
