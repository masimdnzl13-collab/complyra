import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import type { InviteDoc, OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { InviteAcceptForm } from "@/components/invite/invite-accept-form";

export const metadata = constructMetadata({
  title: "Accept your invite",
  path: "/invite",
  noIndex: true,
});

interface InvitePageProps {
  params: { token: string };
}

async function loadInvite(token: string) {
  const db = getAdminFirestore();
  const query = await db.collectionGroup("invites").where("token", "==", token).limit(1).get();
  if (query.empty) return { status: "invalid" as const };

  const inviteSnap = query.docs[0];
  const invite = inviteSnap.data() as InviteDoc;
  const orgRef = inviteSnap.ref.parent.parent;
  if (!orgRef) return { status: "invalid" as const };

  if (invite.status !== "pending") return { status: "used" as const };
  if (invite.expiresAt.toDate().getTime() < Date.now()) return { status: "expired" as const };

  const orgSnap = await orgRef.get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;

  let hasExistingAccount = false;
  try {
    await getAdminAuth().getUserByEmail(invite.email);
    hasExistingAccount = true;
  } catch {
    hasExistingAccount = false;
  }

  return {
    status: "valid" as const,
    email: invite.email,
    organizationName: organization?.companyName ?? "the organization",
    hasExistingAccount,
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const result = await loadInvite(params.token);

  if (result.status !== "valid") {
    const messages: Record<"invalid" | "used" | "expired", string> = {
      invalid: "This invite link is invalid.",
      used: "This invite has already been used.",
      expired: "This invite link has expired. Ask the organization owner to send a new one.",
    };
    return (
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Invite unavailable</h1>
        <p className="mt-2 text-sm text-navy-600">{messages[result.status]}</p>
      </div>
    );
  }

  return (
    <InviteAcceptForm
      token={params.token}
      email={result.email}
      organizationName={result.organizationName}
      hasExistingAccount={result.hasExistingAccount}
    />
  );
}
