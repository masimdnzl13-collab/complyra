import "server-only";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type UserDoc } from "@/lib/firestore/schema";

/** Billing emails go to the org owner — the only role that can see/manage billing. */
export async function getOrgOwnerEmail(orgId: string): Promise<string | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(firestorePaths.users())
    .where("organizationId", "==", orgId)
    .where("role", "==", "owner")
    .limit(1)
    .get();
  if (snap.empty) return null;
  return (snap.docs[0].data() as UserDoc).email;
}
