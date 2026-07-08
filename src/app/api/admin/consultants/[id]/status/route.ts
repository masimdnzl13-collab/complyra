import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type ConsultantApprovalStatus } from "@/lib/firestore/schema";

const VALID_STATUSES: ConsultantApprovalStatus[] = ["approved", "active", "rejected"];

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can review consultant profiles" }, { status: 403 });
  }

  const { status } = await request.json().catch(() => ({}));
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as ConsultantApprovalStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const consultantRef = db.doc(firestorePaths.consultant(params.id));
  const consultantSnap = await consultantRef.get();
  if (!consultantSnap.exists) {
    return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  }

  await consultantRef.update({ approvalStatus: status, updatedAt: FieldValue.serverTimestamp() });
  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "consultant_approved",
    targetCollection: "consultants",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { status },
  });

  return NextResponse.json({ ok: true });
}
