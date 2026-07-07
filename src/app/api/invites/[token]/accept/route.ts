import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type InviteDoc } from "@/lib/firestore/schema";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";

interface RouteParams {
  params: { token: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { idToken } = await request.json();
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
    .collectionGroup("invites")
    .where("token", "==", params.token)
    .limit(1)
    .get();

  if (inviteQuery.empty) {
    return NextResponse.json({ error: "This invite link is invalid." }, { status: 404 });
  }

  const inviteSnap = inviteQuery.docs[0];
  const invite = inviteSnap.data() as InviteDoc;
  const orgRef = inviteSnap.ref.parent.parent;

  if (!orgRef) {
    return NextResponse.json({ error: "This invite link is invalid." }, { status: 404 });
  }
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

  const orgId = orgRef.id;
  const userRef = db.doc(firestorePaths.user(decoded.uid));
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();

  // One org per user: accepting an invite always (re)writes the full user
  // doc, so an existing account switches into the new org rather than
  // holding membership in two at once.
  const batch = db.batch();
  batch.set(userRef, {
    organizationId: orgId,
    role: "member",
    email: decoded.email ?? invite.email,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(inviteSnap.ref, {
    status: "accepted",
    acceptedAt: FieldValue.serverTimestamp(),
  });
  batch.set(auditRef, {
    actorId: decoded.uid,
    action: "invite_accepted",
    targetCollection: "invites",
    targetId: inviteSnap.id,
    timestamp: FieldValue.serverTimestamp(),
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

  return NextResponse.json({ ok: true, organizationId: orgId });
}
