import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import {
  firestorePaths,
  type AiUsageContext,
  type EmployeeCountRange,
  type EuRelation,
} from "@/lib/firestore/schema";

interface OnboardingBody {
  companyName: string;
  country: string;
  industry: string;
  employeeCountRange: EmployeeCountRange;
  euRelation: EuRelation;
  aiUsageContext: AiUsageContext;
}

function isValidBody(body: unknown): body is OnboardingBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.companyName === "string" &&
    b.companyName.trim().length > 0 &&
    typeof b.country === "string" &&
    b.country.trim().length > 0 &&
    typeof b.industry === "string" &&
    b.industry.trim().length > 0 &&
    typeof b.employeeCountRange === "string" &&
    typeof b.euRelation === "object" &&
    b.euRelation !== null &&
    typeof (b.euRelation as EuRelation).isEuBased === "boolean" &&
    typeof (b.euRelation as EuRelation).sellsToEu === "boolean" &&
    typeof b.aiUsageContext === "string"
  );
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid onboarding data" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const userRef = db.doc(firestorePaths.user(session.uid));
  const existingUser = await userRef.get();
  if (existingUser.exists) {
    return NextResponse.json({ error: "Account is already onboarded" }, { status: 409 });
  }

  const orgRef = db.collection(firestorePaths.organizations()).doc();
  const auditRef = db.collection(firestorePaths.auditLog(orgRef.id)).doc();

  const batch = db.batch();
  batch.set(orgRef, {
    companyName: body.companyName.trim(),
    country: body.country.trim(),
    industry: body.industry.trim(),
    employeeCountRange: body.employeeCountRange,
    euRelation: body.euRelation,
    aiUsageContext: body.aiUsageContext,
    createdAt: FieldValue.serverTimestamp(),
    subscription: {
      planId: "free",
      status: "active",
      currentPeriodEnd: null,
    },
    usage: {
      documentsGeneratedThisMonth: 0,
      registeredSystemsCount: 0,
    },
  });
  batch.set(userRef, {
    organizationId: orgRef.id,
    role: "owner",
    email: session.email ?? "",
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(auditRef, {
    actorId: session.uid,
    action: "organization_created",
    targetCollection: "organizations",
    targetId: orgRef.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return NextResponse.json({ ok: true, organizationId: orgRef.id });
}
