import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentConsultant } from "@/lib/auth/current-consultant";
import { firestorePaths, type ExpertReviewDoc } from "@/lib/firestore/schema";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (consultant.consultant.approvalStatus !== "active") {
    return NextResponse.json({ error: "Your profile isn't active yet" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const reviewRef = db.doc(firestorePaths.expertReview(params.id));

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(reviewRef);
      if (!snap.exists) throw new Error("not_found");
      const review = snap.data() as ExpertReviewDoc;
      if (review.status !== "pending_assignment") throw new Error("already_claimed");
      tx.update(reviewRef, {
        consultantId: consultant.uid,
        status: "accepted",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "not_found") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "already_claimed") {
      return NextResponse.json({ error: "This request has already been claimed by another consultant" }, { status: 409 });
    }
    throw err;
  }

  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: consultant.uid,
    action: "expert_review_accepted",
    targetCollection: "expertReviews",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
