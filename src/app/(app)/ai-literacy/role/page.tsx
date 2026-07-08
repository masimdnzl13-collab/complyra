import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { constructMetadata } from "@/lib/construct-metadata";
import { RoleSelector } from "@/components/ai-literacy/role-selector";

export const metadata = constructMetadata({ title: "Select your role", path: "/ai-literacy/role", noIndex: true });

export default async function RoleSelectionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  return <RoleSelector />;
}
