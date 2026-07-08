import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type ComplianceDocumentDoc } from "@/lib/firestore/schema";

interface RouteParams {
  params: { id: string };
}

interface PatchBody {
  fixedFields: { companyName: string; systemName: string; preparedBy: string };
  sections: { id: string; title: string; content: string }[];
}

function isValidPatchBody(body: unknown): body is PatchBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!b.fixedFields || typeof b.fixedFields !== "object") return false;
  const f = b.fixedFields as Record<string, unknown>;
  if (typeof f.companyName !== "string" || typeof f.systemName !== "string" || typeof f.preparedBy !== "string") {
    return false;
  }
  if (!Array.isArray(b.sections)) return false;
  return b.sections.every(
    (s) =>
      s &&
      typeof s === "object" &&
      typeof (s as Record<string, unknown>).id === "string" &&
      typeof (s as Record<string, unknown>).title === "string" &&
      typeof (s as Record<string, unknown>).content === "string"
  );
}

/** Edits create a new version rather than mutating in place — see the versioning note on ComplianceDocumentDoc. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can edit documents" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidPatchBody(body)) {
    return NextResponse.json({ error: "Invalid document data" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const currentRef = db.doc(firestorePaths.document(orgId, params.id));
  const currentSnap = await currentRef.get();
  if (!currentSnap.exists) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const current = currentSnap.data() as ComplianceDocumentDoc;

  const newRef = db.collection(firestorePaths.documents(orgId)).doc();
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.update(currentRef, { isCurrent: false });
  batch.set(newRef, {
    assessmentId: current.assessmentId,
    aiSystemId: current.aiSystemId,
    type: current.type,
    version: current.version + 1,
    isCurrent: true,
    status: "draft",
    fixedFields: { ...current.fixedFields, ...body.fixedFields, approvedAt: null },
    sections: body.sections,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
  });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "record_updated",
    targetCollection: "documents",
    targetId: newRef.id,
    timestamp: now,
    metadata: { type: current.type, version: current.version + 1 },
  });

  await batch.commit();

  return NextResponse.json({ ok: true, id: newRef.id });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can delete documents" }, { status: 403 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const docRef = db.doc(firestorePaths.document(orgId, params.id));
  const snap = await docRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const doc = snap.data() as ComplianceDocumentDoc;
  if (doc.status !== "draft") {
    return NextResponse.json({ error: "Only draft documents can be deleted — reviewed documents are kept for the audit trail" }, { status: 403 });
  }

  await docRef.delete();
  return NextResponse.json({ ok: true });
}
