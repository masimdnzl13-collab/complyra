import Link from "next/link";
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

  const productTourSection = (
    <div className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Product tour</h2>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-navy-100 bg-surface p-5">
        <p className="text-sm text-navy-600">Replay the guided walkthrough of Dashboard, AI Systems, and every other section.</p>
        <Link
          href="/dashboard?tour=replay"
          className="shrink-0 rounded-md border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
        >
          Show tour again
        </Link>
      </div>
    </div>
  );

  if (user.userDoc.role !== "owner") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Settings</h1>
        <p className="mt-1 text-navy-600">Only the organization owner can change notification settings.</p>
        {productTourSection}
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

      {productTourSection}
    </div>
  );
}
