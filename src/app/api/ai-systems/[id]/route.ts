import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths } from "@/lib/firestore/schema";
import { isValidAiSystemInput } from "@/lib/ai-systems/validate";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can edit AI systems" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidAiSystemInput(body)) {
    return NextResponse.json({ error: "Invalid AI system data" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const systemRef = db.doc(firestorePaths.aiSystem(orgId, params.id));
  const systemSnap = await systemRef.get();
  if (!systemSnap.exists) {
    return NextResponse.json({ error: "AI system not found" }, { status: 404 });
  }

  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
  const batch = db.batch();
  batch.update(systemRef, {
    name: body.name.trim(),
    description: body.description.trim(),
    role: body.role,
    vendor: body.vendor.trim(),
    businessArea: body.businessArea,
    purpose: body.purpose.trim(),
    dataTypes: body.dataTypes,
    affectedGroups: body.affectedGroups,
    decisionMakingRole: body.decisionMakingRole,
    interactsWithPeople: body.interactsWithPeople,
    generatesSyntheticContent: body.generatesSyntheticContent,
    infersEmotionOrBehavior: body.infersEmotionOrBehavior,
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "record_updated",
    targetCollection: "aiSystems",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return NextResponse.json({ ok: true });
}
