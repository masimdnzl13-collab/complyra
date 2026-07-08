import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { pricingPlans } from "@/config/site";
import { checkPastDue } from "@/lib/billing/quota";
import { isValidAiSystemInput } from "@/lib/ai-systems/validate";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can add AI systems" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidAiSystemInput(body)) {
    return NextResponse.json({ error: "Invalid AI system data" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const orgRef = db.doc(firestorePaths.organization(orgId));
  const orgSnap = await orgRef.get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const pastDue = checkPastDue(organization);
  if (pastDue) {
    return NextResponse.json({ error: pastDue }, { status: 403 });
  }

  const plan = pricingPlans.find((p) => p.id === organization.subscription.planId);
  const limit = plan?.systemsLimit ?? 1;
  if (limit !== "unlimited" && organization.usage.registeredSystemsCount >= limit) {
    return NextResponse.json(
      {
        error: `Your ${plan?.name ?? "current"} plan supports up to ${limit} AI system${limit === 1 ? "" : "s"}. Upgrade your plan to add more.`,
      },
      { status: 403 }
    );
  }

  const systemRef = db.collection(firestorePaths.aiSystems(orgId)).doc();
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.set(systemRef, {
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
    status: "active",
    assessmentStatus: "not_assessed",
    createdAt: now,
    updatedAt: now,
  });
  batch.update(orgRef, { "usage.registeredSystemsCount": FieldValue.increment(1) });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "record_created",
    targetCollection: "aiSystems",
    targetId: systemRef.id,
    timestamp: now,
  });

  await batch.commit();

  return NextResponse.json({ ok: true, id: systemRef.id });
}
