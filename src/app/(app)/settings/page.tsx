import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { resolveEmailPreferences } from "@/lib/email/preferences";
import { EmailPreferencesForm } from "@/components/settings/email-preferences-form";

export const metadata = constructMetadata({
  title: "Settings",
  path: "/settings",
  noIndex: true,
});

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  if (user.userDoc.role !== "owner") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">Settings</h1>
        <p className="mt-2 text-navy-600">Only the organization owner can change these settings.</p>
      </div>
    );
  }

  const orgSnap = await getAdminFirestore().doc(firestorePaths.organization(user.userDoc.organizationId)).get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Settings</h1>
      <p className="mt-1 text-navy-600">Manage email notifications for your organization.</p>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Email preferences</h2>
        <div className="mt-3">
          <EmailPreferencesForm initialPreferences={resolveEmailPreferences(organization)} />
        </div>
      </div>
    </div>
  );
}
