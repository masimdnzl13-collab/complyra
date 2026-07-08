import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type EmployeeRole, type OrganizationDoc, type TrainingRecordDoc } from "@/lib/firestore/schema";
import { pricingPlans } from "@/config/site";
import { checkPastDue } from "@/lib/billing/quota";

const ROLES = new Set<EmployeeRole>(["technical", "hr", "business", "executive", "general", "other"]);

interface RequestBody {
  role: EmployeeRole;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.role === "string" && ROLES.has(b.role as EmployeeRole);
}

/**
 * Any signed-in, onboarded org member can enroll themselves — this isn't
 * owner-gated like most other write routes, because every employee takes
 * their own training. The seat quota is enforced here, on first enrollment,
 * per the spec's "checked server-side when a team member is added to
 * training" requirement.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const recordRef = db.doc(firestorePaths.trainingRecord(orgId, user.uid));
  const recordSnap = await recordRef.get();

  if (recordSnap.exists) {
    // Already enrolled — allow changing the selected role without spending another seat.
    await recordRef.update({ role: body.role, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  }

  const orgSnap = await db.doc(firestorePaths.organization(orgId)).get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const pastDue = checkPastDue(organization);
  if (pastDue) return NextResponse.json({ error: pastDue }, { status: 403 });

  const plan = pricingPlans.find((p) => p.id === organization.subscription.planId);
  const seatLimit = plan?.aiLiteracySeats ?? 5;
  if (seatLimit !== "unlimited") {
    const countSnap = await db.collection(firestorePaths.trainingRecords(orgId)).count().get();
    if (countSnap.data().count >= seatLimit) {
      return NextResponse.json(
        {
          error: `Your ${plan?.name ?? "current"} plan supports AI literacy training for up to ${seatLimit} employees. Upgrade your plan to add more.`,
        },
        { status: 403 }
      );
    }
  }

  const now = FieldValue.serverTimestamp();
  await recordRef.set({
    userId: user.uid,
    userName: user.email.split("@")[0],
    userEmail: user.email,
    role: body.role,
    startedAt: now,
    completedAt: null,
    certificateId: null,
    moduleProgress: {},
    createdAt: now,
    updatedAt: now,
  } satisfies Omit<TrainingRecordDoc, "startedAt" | "createdAt" | "updatedAt"> & { startedAt: unknown; createdAt: unknown; updatedAt: unknown });

  return NextResponse.json({ ok: true });
}
