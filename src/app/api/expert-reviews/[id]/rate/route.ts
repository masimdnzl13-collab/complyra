import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type ConsultantDoc, type ExpertReviewDoc } from "@/lib/firestore/schema";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { stars, comment } = await request.json().catch(() => ({}));
  if (typeof stars !== "number" || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const reviewRef = db.doc(firestorePaths.expertReview(params.id));
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const review = reviewSnap.data() as ExpertReviewDoc;

  if (review.organizationId !== user.userDoc.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (review.status !== "review_submitted") {
    return NextResponse.json({ error: "This review can't be rated at this stage" }, { status: 409 });
  }
  if (!review.consultantId) {
    return NextResponse.json({ error: "No consultant assigned" }, { status: 409 });
  }

  const consultantRef = db.doc(firestorePaths.consultant(review.consultantId));

  await db.runTransaction(async (tx) => {
    const consultantSnap = await tx.get(consultantRef);
    const consultant = consultantSnap.data() as ConsultantDoc | undefined;
    const priorCount = consultant?.ratingCount ?? 0;
    const priorAverage = consultant?.ratingAverage ?? 0;
    const newCount = priorCount + 1;
    const newAverage = (priorAverage * priorCount + stars) / newCount;

    tx.update(reviewRef, {
      rating: { stars, comment: typeof comment === "string" ? comment.trim() : "", ratedAt: Timestamp.now() },
      status: "completed",
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(consultantRef, { ratingAverage: newAverage, ratingCount: newCount });
  });

  await db.collection(firestorePaths.auditLog(review.organizationId)).add({
    actorId: user.uid,
    action: "review_rated",
    targetCollection: "expertReviews",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
