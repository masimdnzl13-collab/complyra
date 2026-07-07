import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { InviteTeammateForm } from "@/components/team/invite-teammate-form";

export const metadata = constructMetadata({
  title: "Dashboard",
  path: "/dashboard",
  noIndex: true,
});

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgSnap = await getAdminFirestore()
    .doc(firestorePaths.organization(user.userDoc.organizationId))
    .get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">
        Welcome{organization ? `, ${organization.companyName}` : ""}
      </h1>
      <p className="mt-4 text-navy-600">
        This is a placeholder panel — the real dashboard (AI system inventory, risk
        assessments, and generated documents) will be built in a later step.
      </p>

      {user.userDoc.role === "owner" && (
        <div className="mt-10">
          <InviteTeammateForm />
        </div>
      )}
    </div>
  );
}
