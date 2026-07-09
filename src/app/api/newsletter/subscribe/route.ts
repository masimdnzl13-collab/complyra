import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`newsletter-subscribe:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
