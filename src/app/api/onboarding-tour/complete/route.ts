import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";

/** Marks the dashboard product tour as seen so it stops auto-opening — never resets it, only settings' "show tour again" replays it via ?tour=replay. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await getAdminFirestore()
    .doc(firestorePaths.user(user.uid))
    .update({ onboardingTourCompletedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ ok: true });
}
