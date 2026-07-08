import { redirect } from "next/navigation";
import { getCurrentConsultant } from "@/lib/auth/current-consultant";
import { ConsultantShell } from "@/components/consultant/consultant-shell";
import { siteConfig } from "@/config/site";

/**
 * Mirrors (app)/layout.tsx's guard, but for the separate consultant identity
 * track — getCurrentConsultant() is the authoritative check here, same as
 * getCurrentUser() is for the org-facing app.
 */
export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const consultant = await getCurrentConsultant();
  if (!consultant) redirect("/login");

  const profileComplete = consultant.consultant.name.trim().length > 0;

  // A freshly-accepted invite creates a bare ConsultantDoc stub (empty
  // name) — let /consultant/onboarding itself render so they can complete
  // it, rather than blocking on an approval status that doesn't apply yet.
  if (!profileComplete) {
    return <ConsultantShell name={consultant.email}>{children}</ConsultantShell>;
  }

  if (consultant.consultant.approvalStatus === "pending_approval") {
    return (
      <ConsultantShell name={consultant.consultant.name}>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="text-xl font-semibold text-navy-900">Your profile is under review</h1>
          <p className="mt-2 text-sm text-navy-600">
            We&apos;ll email you once an admin approves your consultant profile.
          </p>
        </div>
      </ConsultantShell>
    );
  }
  if (consultant.consultant.approvalStatus === "rejected") {
    return (
      <ConsultantShell name={consultant.consultant.name}>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="text-xl font-semibold text-navy-900">Profile not approved</h1>
          <p className="mt-2 text-sm text-navy-600">
            Contact {siteConfig.contact.supportEmail} if you believe this is a mistake.
          </p>
        </div>
      </ConsultantShell>
    );
  }

  return <ConsultantShell name={consultant.consultant.name}>{children}</ConsultantShell>;
}
