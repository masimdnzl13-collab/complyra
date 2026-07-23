import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ConsultantInviteDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { ConsultantOnboardingForm } from "@/components/consultant/consultant-onboarding-form";

export const metadata = constructMetadata({
  title: "Join the consultant network",
  path: "/consultant-invite",
  noIndex: true,
});

interface InvitePageProps {
  params: { token: string };
}

async function loadInvite(token: string) {
  const db = getAdminFirestore();
  const query = await db.collection(firestorePaths.consultantInvites()).where("token", "==", token).limit(1).get();
  if (query.empty) return { status: "invalid" as const };

  const invite = query.docs[0].data() as ConsultantInviteDoc;
  if (invite.status !== "pending") return { status: "used" as const };
  if (invite.expiresAt.toDate().getTime() < Date.now()) return { status: "expired" as const };

  let hasExistingAccount = false;
  try {
    await getAdminAuth().getUserByEmail(invite.email);
    hasExistingAccount = true;
  } catch {
    hasExistingAccount = false;
  }

  return { status: "valid" as const, email: invite.email, hasExistingAccount };
}

export default async function ConsultantInvitePage({ params }: InvitePageProps) {
  const result = await loadInvite(params.token);

  if (result.status !== "valid") {
    const messages: Record<"invalid" | "used" | "expired", string> = {
      invalid: "This invite link is invalid.",
      used: "This invite has already been used.",
      expired: "This invite link has expired. Ask your Vermoncy contact to send a new one.",
    };
    return (
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Invite unavailable</h1>
        <p className="mt-2 text-sm text-navy-600">{messages[result.status]}</p>
      </div>
    );
  }

  return (
    <ConsultantOnboardingForm token={params.token} email={result.email} hasExistingAccount={result.hasExistingAccount} />
  );
}
