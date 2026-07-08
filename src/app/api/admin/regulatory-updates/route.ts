import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type RegulatoryUpdateCategory } from "@/lib/firestore/schema";

const CATEGORIES: RegulatoryUpdateCategory[] = ["transparency", "high_risk", "prohibited", "general"];

interface CreateInput {
  title: string;
  summary: string;
  sourceUrl: string;
  category: RegulatoryUpdateCategory;
}

function isValid(body: unknown): body is CreateInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.title === "string" &&
    b.title.trim().length > 0 &&
    typeof b.summary === "string" &&
    b.summary.trim().length > 0 &&
    typeof b.sourceUrl === "string" &&
    b.sourceUrl.trim().length > 0 &&
    CATEGORIES.includes(b.category as RegulatoryUpdateCategory)
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValid(body)) {
    return NextResponse.json({ error: "Please fill in every field" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.collection(firestorePaths.regulatoryUpdates()).doc();
  await ref.set({
    title: body.title.trim(),
    summary: body.summary.trim(),
    sourceUrl: body.sourceUrl.trim(),
    category: body.category,
    publishedAt: Timestamp.now(),
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "admin_regulatory_update_created",
    targetCollection: "regulatoryUpdates",
    targetId: ref.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
