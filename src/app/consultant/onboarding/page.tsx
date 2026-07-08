import { redirect } from "next/navigation";
import { getCurrentConsultant } from "@/lib/auth/current-consultant";
import { constructMetadata } from "@/lib/construct-metadata";
import { ConsultantProfileForm } from "@/components/consultant/consultant-profile-form";

export const metadata = constructMetadata({
  title: "Set up your consultant profile",
  path: "/consultant/onboarding",
  noIndex: true,
});

export default async function ConsultantOnboardingPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) redirect("/login");
  if (consultant.consultant.name.trim().length > 0) redirect("/consultant/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Set up your profile</h1>
      <p className="mt-1 text-navy-600">
        This is what companies see when they&apos;re matched with you for an expert review. An admin will review it
        before it goes live.
      </p>
      <div className="mt-8">
        <ConsultantProfileForm />
      </div>
    </div>
  );
}
