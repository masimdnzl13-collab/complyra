import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { AppShell } from "@/components/app/app-shell";
import { siteConfig } from "@/config/site";

/**
 * The authoritative session check for every page under (app) — this is
 * what src/middleware.ts's cookie-presence check is only an optimistic
 * preview of. getCurrentUser() verifies the session cookie against
 * Firebase Auth via the Admin SDK.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isPlatformAdmin = isSuperAdminUid(user.uid);

  if (user.userDoc) {
    const orgSnap = await getAdminFirestore().doc(firestorePaths.organization(user.userDoc.organizationId)).get();
    const organization = orgSnap.data() as OrganizationDoc | undefined;
    if (organization?.suspended) {
      return (
        <AppShell email={user.email} isOwner={false} isPlatformAdmin={isPlatformAdmin}>
          <div className="mx-auto max-w-md px-6 py-24 text-center">
            <h1 className="text-xl font-semibold text-navy-900">Account suspended</h1>
            <p className="mt-2 text-sm text-navy-600">
              Your organization&apos;s access has been suspended. Contact {siteConfig.contact.supportEmail} for help.
            </p>
          </div>
        </AppShell>
      );
    }
  }

  return (
    <AppShell email={user.email} isOwner={user.userDoc?.role === "owner"} isPlatformAdmin={isPlatformAdmin}>
      {children}
    </AppShell>
  );
}
