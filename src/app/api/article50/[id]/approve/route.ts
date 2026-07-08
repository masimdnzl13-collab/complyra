import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type Article50Artifact } from "@/lib/firestore/schema";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can review documents" }, { status: 403 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.article50Artifact(orgId, params.id));
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const artifact = snap.data() as Article50Artifact;
  if (artifact.status === "reviewed") return NextResponse.json({ ok: true });

  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
  const batch = db.batch();
  batch.update(ref, { status: "reviewed", updatedAt: FieldValue.serverTimestamp() });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "record_updated",
    targetCollection: "article50Artifacts",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { area: artifact.area, approved: true },
  });
  await batch.commit();

  return NextResponse.json({ ok: true });
}
