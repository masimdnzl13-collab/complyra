import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type ConsultantInviteDoc } from "@/lib/firestore/schema";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";

interface RouteParams {
  params: { token: string };
}

/**
 * Creates the Firebase session and a bare ConsultantDoc stub (empty profile
 * fields) — the full profile is filled in next, on the wider
 * /consultant/onboarding page under the consultant shell rather than
 * cramped into the narrow (auth) card. See ConsultantLayout: a stub with an
 * empty `name` is what routes a freshly-accepted consultant to onboarding
 * instead of the "pending approval" screen.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { idToken } = await request.json().catch(() => ({}));
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Your sign-in has expired. Please try again." }, { status: 401 });
  }

  const db = getAdminFirestore();
  const inviteQuery = await db
    .collection(firestorePaths.consultantInvites())
    .where("token", "==", params.token)
    .limit(1)
    .get();

  if (inviteQuery.empty) {
    return NextResponse.json({ error: "This invite link is invalid." }, { status: 404 });
  }

  const inviteSnap = inviteQuery.docs[0];
  const invite = inviteSnap.data() as ConsultantInviteDoc;

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 410 });
  }
  if (invite.expiresAt.toDate().getTime() < Date.now()) {
    return NextResponse.json({ error: "This invite link has expired." }, { status: 410 });
  }
  if ((decoded.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invite was sent to ${invite.email}. Please sign in with that email address.` },
      { status: 403 }
    );
  }

  const consultantRef = db.doc(firestorePaths.consultant(decoded.uid));
  const auditRef = db.collection(firestorePaths.platformAuditLog()).doc();
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.set(consultantRef, {
    email: decoded.email ?? invite.email,
    name: "",
    expertiseAreas: [],
    languages: [],
    hourlyRate: 0,
    yearsExperience: 0,
    bio: "",
    worksWithTurkey: false,
    certifications: [],
    references: [],
    approvalStatus: "pending_approval",
    averageTurnaround: "2d",
    isAvailable: true,
    ratingAverage: 0,
    ratingCount: 0,
    casesCompleted: 0,
    invitedBy: invite.invitedBy,
    createdAt: now,
    updatedAt: now,
  });
  batch.update(inviteSnap.ref, { status: "accepted", acceptedAt: now });
  batch.set(auditRef, {
    actorId: decoded.uid,
    action: "invite_accepted",
    targetCollection: "consultants",
    targetId: decoded.uid,
    timestamp: now,
  });
  await batch.commit();

  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
