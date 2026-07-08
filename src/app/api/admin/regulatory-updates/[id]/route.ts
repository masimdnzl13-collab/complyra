import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type RegulatoryUpdateCategory } from "@/lib/firestore/schema";

const CATEGORIES: RegulatoryUpdateCategory[] = ["transparency", "high_risk", "prohibited", "general"];

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
  if (typeof body.summary === "string" && body.summary.trim()) updates.summary = body.summary.trim();
  if (typeof body.sourceUrl === "string" && body.sourceUrl.trim()) updates.sourceUrl = body.sourceUrl.trim();
  if (CATEGORIES.includes(body.category)) updates.category = body.category;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.regulatoryUpdate(params.id));
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ref.update(updates);
  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "admin_regulatory_update_updated",
    targetCollection: "regulatoryUpdates",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.regulatoryUpdate(params.id));
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ref.delete();
  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "admin_regulatory_update_deleted",
    targetCollection: "regulatoryUpdates",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
