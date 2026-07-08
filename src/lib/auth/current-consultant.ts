import "server-only";
import { cache } from "react";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ConsultantDoc } from "@/lib/firestore/schema";
import { getSessionUser } from "./session";

export interface CurrentConsultant {
  uid: string;
  email: string;
  consultant: ConsultantDoc;
}

/**
 * Consultants are a separate identity track from CurrentUser/UserDoc — same
 * Firebase Auth session cookie, but looked up in `consultants/{uid}` instead
 * of `users/{uid}`. A signed-in person with no ConsultantDoc simply isn't a
 * consultant (returns null), the same way a signed-in person with no UserDoc
 * isn't onboarded yet.
 */
export const getCurrentConsultant = cache(async (): Promise<CurrentConsultant | null> => {
  const session = await getSessionUser();
  if (!session) return null;

  const snapshot = await getAdminFirestore().doc(firestorePaths.consultant(session.uid)).get();
  if (!snapshot.exists) return null;

  return {
    uid: session.uid,
    email: session.email ?? "",
    consultant: snapshot.data() as ConsultantDoc,
  };
});
