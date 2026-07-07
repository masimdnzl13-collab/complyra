import "server-only";
import { cache } from "react";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type UserDoc } from "@/lib/firestore/schema";
import { getSessionUser } from "./session";

export interface CurrentUser {
  uid: string;
  email: string;
  /** null means the account exists in Firebase Auth but hasn't completed onboarding yet. */
  userDoc: UserDoc | null;
}

/**
 * Wrapped in React's cache() so the (app) layout's guard check and each
 * page's own org check dedupe into a single Admin SDK round trip per
 * request instead of re-verifying the session cookie on every call.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSessionUser();
  if (!session) return null;

  const snapshot = await getAdminFirestore().doc(firestorePaths.user(session.uid)).get();

  return {
    uid: session.uid,
    email: session.email ?? "",
    userDoc: snapshot.exists ? (snapshot.data() as UserDoc) : null,
  };
});
