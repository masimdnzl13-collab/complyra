import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = getAdminFirestore();
  const docId = encodeURIComponent(normalizedEmail);

  await db.doc(firestorePaths.newsletterSubscriber(docId)).set(
    {
      email: normalizedEmail,
      subscribedAt: FieldValue.serverTimestamp(),
      source: "homepage",
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
