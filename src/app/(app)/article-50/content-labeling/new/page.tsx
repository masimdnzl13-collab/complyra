import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { constructMetadata } from "@/lib/construct-metadata";
import { ContentLabelingWizard } from "@/components/article50/content-labeling-wizard";

export const metadata = constructMetadata({ title: "Content labeling", path: "/article-50/content-labeling", noIndex: true });

export default async function NewContentLabelingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");
  if (user.userDoc.role !== "owner") redirect("/article-50");

  return <ContentLabelingWizard />;
}
