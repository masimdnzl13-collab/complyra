import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { resolveEmailPreferences } from "@/lib/email/preferences";
import { verifyOrgUnsubscribeToken, verifyNewsletterUnsubscribeToken, type OrgEmailCategory } from "@/lib/email/unsubscribe-token";

export const metadata = constructMetadata({
  title: "Unsubscribe",
  path: "/unsubscribe",
  noIndex: true,
});

interface UnsubscribePageProps {
  searchParams: { org?: string; category?: string; email?: string; token?: string };
}

async function handleUnsubscribe(params: UnsubscribePageProps["searchParams"]): Promise<string> {
  const { org, category, email, token } = params;
  if (!token) return "This unsubscribe link is invalid.";

  if (org && category) {
    if (!verifyOrgUnsubscribeToken(org, category, token)) return "This unsubscribe link is invalid or expired.";

    const db = getAdminFirestore();
    const orgRef = db.doc(firestorePaths.organization(org));
    const orgSnap = await orgRef.get();
    if (!orgSnap.exists) return "This unsubscribe link is invalid.";

    const organization = orgSnap.data() as OrganizationDoc;
    const current = resolveEmailPreferences(organization);
    const updated =
      category === "all"
        ? { ...current, notificationsEnabled: false }
        : { ...current, [category as OrgEmailCategory]: false };
    await orgRef.update({ emailPreferences: updated });
    return "You've been unsubscribed from this type of email. You can change this anytime in Settings.";
  }

  if (email) {
    if (!verifyNewsletterUnsubscribeToken(email, token)) return "This unsubscribe link is invalid or expired.";
    const db = getAdminFirestore();
    await db
      .doc(firestorePaths.newsletterSubscriber(email.toLowerCase()))
      .update({ unsubscribed: true })
      .catch(() => {});
    return "You've been unsubscribed from AI Act regulatory updates.";
  }

  return "This unsubscribe link is invalid.";
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const message = await handleUnsubscribe(searchParams);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-xl font-semibold text-navy-900">Email preferences</h1>
      <p className="mt-3 text-sm text-navy-600">{message}</p>
    </div>
  );
}
