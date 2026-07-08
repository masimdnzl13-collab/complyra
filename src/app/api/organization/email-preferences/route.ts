import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc, type OrganizationEmailPreferences } from "@/lib/firestore/schema";
import { resolveEmailPreferences } from "@/lib/email/preferences";

function isValidPreferences(body: unknown): body is OrganizationEmailPreferences {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.notificationsEnabled === "boolean" &&
    typeof b.deadlineReminders === "boolean" &&
    typeof b.regulatoryNews === "boolean" &&
    typeof b.renewalReminders === "boolean"
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can change email preferences" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidPreferences(body)) {
    return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
  }

  const db = getAdminFirestore();
  await db.doc(firestorePaths.organization(user.userDoc.organizationId)).update({ emailPreferences: body });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const orgSnap = await db.doc(firestorePaths.organization(user.userDoc.organizationId)).get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  return NextResponse.json({ preferences: resolveEmailPreferences(organization) });
}
