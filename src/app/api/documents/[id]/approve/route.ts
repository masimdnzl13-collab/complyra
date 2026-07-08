import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type ComplianceDocumentDoc } from "@/lib/firestore/schema";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can approve documents" }, { status: 403 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const docRef = db.doc(firestorePaths.document(orgId, params.id));
  const snap = await docRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const doc = snap.data() as ComplianceDocumentDoc;
  if (doc.status === "reviewed") {
    return NextResponse.json({ ok: true });
  }

  const approvedAt = new Date().toISOString().slice(0, 10);
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
  const batch = db.batch();
  batch.update(docRef, {
    status: "reviewed",
    "fixedFields.approvedAt": approvedAt,
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "record_updated",
    targetCollection: "documents",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { type: doc.type, approved: true },
  });
  await batch.commit();

  return NextResponse.json({ ok: true });
}
