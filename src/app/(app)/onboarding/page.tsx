import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { constructMetadata } from "@/lib/construct-metadata";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata = constructMetadata({
  title: "Set up your organization",
  path: "/onboarding",
  noIndex: true,
});

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.userDoc) redirect("/dashboard");

  return <OnboardingWizard />;
}
