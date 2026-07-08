import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type ConsultantDoc, type ExpertReviewDoc } from "@/lib/firestore/schema";
import { consultantCommissionRate } from "@/config/site";
import { createConsultationCheckoutSession } from "@/lib/consultant/stripe-client";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can accept a proposal" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const reviewRef = db.doc(firestorePaths.expertReview(params.id));
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const review = reviewSnap.data() as ExpertReviewDoc;

  if (review.organizationId !== user.userDoc.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (review.status !== "proposal_sent" || !review.proposal) {
    return NextResponse.json({ error: "There's no pending proposal to accept" }, { status: 409 });
  }
  if (!review.consultantId) {
    return NextResponse.json({ error: "No consultant assigned" }, { status: 409 });
  }

  const consultantSnap = await db.doc(firestorePaths.consultant(review.consultantId)).get();
  const consultant = consultantSnap.data() as ConsultantDoc | undefined;
  if (!consultant) return NextResponse.json({ error: "Consultant not found" }, { status: 404 });

  const commission = Math.round(review.proposal.estimatedTotal * consultantCommissionRate * 100) / 100;

  const { url } = await createConsultationCheckoutSession({
    expertReviewId: params.id,
    consultantName: consultant.name,
    consultantFee: review.proposal.estimatedTotal,
    commission,
    userEmail: user.email,
  });

  await reviewRef.update({ commissionAmount: commission, updatedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ url });
}
