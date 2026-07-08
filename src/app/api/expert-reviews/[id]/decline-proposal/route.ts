import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type ExpertReviewDoc } from "@/lib/firestore/schema";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can decline a proposal" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const reviewRef = db.doc(firestorePaths.expertReview(params.id));
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const review = reviewSnap.data() as ExpertReviewDoc;

  if (review.organizationId !== user.userDoc.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (review.status !== "proposal_sent") {
    return NextResponse.json({ error: "There's no pending proposal to decline" }, { status: 409 });
  }

  await reviewRef.update({ status: "proposal_declined", updatedAt: FieldValue.serverTimestamp() });
  await db.collection(firestorePaths.auditLog(review.organizationId)).add({
    actorId: user.uid,
    action: "proposal_declined",
    targetCollection: "expertReviews",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
