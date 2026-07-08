import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type ExpertReviewDoc } from "@/lib/firestore/schema";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can flag reviews" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const reviewRef = db.doc(firestorePaths.expertReview(params.id));
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const review = reviewSnap.data() as ExpertReviewDoc;

  await reviewRef.update({ flaggedForQualityReview: !review.flaggedForQualityReview });
  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "record_updated",
    targetCollection: "expertReviews",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { flaggedForQualityReview: !review.flaggedForQualityReview },
  });

  return NextResponse.json({ ok: true });
}
