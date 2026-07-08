import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type AiSystemDoc } from "@/lib/firestore/schema";

interface RouteParams {
  params: { id: string };
}

/**
 * Archives (never deletes — see CLAUDE.md's audit-trail-integrity rule) by
 * setting status to "retired". Frees a slot against the plan's system
 * quota: registeredSystemsCount tracks non-retired systems, not history.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can archive AI systems" }, { status: 403 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const systemRef = db.doc(firestorePaths.aiSystem(orgId, params.id));
  const systemSnap = await systemRef.get();
  if (!systemSnap.exists) {
    return NextResponse.json({ error: "AI system not found" }, { status: 404 });
  }
  const system = systemSnap.data() as AiSystemDoc;
  if (system.status === "retired") {
    return NextResponse.json({ ok: true });
  }

  const orgRef = db.doc(firestorePaths.organization(orgId));
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.update(systemRef, { status: "retired", updatedAt: now });
  batch.update(orgRef, { "usage.registeredSystemsCount": FieldValue.increment(-1) });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "record_updated",
    targetCollection: "aiSystems",
    targetId: params.id,
    timestamp: now,
    metadata: { archived: true },
  });

  await batch.commit();

  return NextResponse.json({ ok: true });
}
