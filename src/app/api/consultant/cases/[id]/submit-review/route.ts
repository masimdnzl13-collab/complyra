import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentConsultant } from "@/lib/auth/current-consultant";
import { firestorePaths, type ExpertReviewDoc } from "@/lib/firestore/schema";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { sendReviewReadyEmail } from "@/lib/email/send-expert-review-email";

interface RouteParams {
  params: { id: string };
}

interface ReportInput {
  executiveSummary: string;
  legalAnalysis: string;
  recommendation: string;
}

function isValidReport(body: unknown): body is ReportInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.executiveSummary === "string" &&
    b.executiveSummary.trim().length > 0 &&
    typeof b.legalAnalysis === "string" &&
    b.legalAnalysis.trim().length > 0 &&
    typeof b.recommendation === "string" &&
    b.recommendation.trim().length > 0
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidReport(body)) {
    return NextResponse.json({ error: "Please complete every section of the report" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const reviewRef = db.doc(firestorePaths.expertReview(params.id));
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  const review = reviewSnap.data() as ExpertReviewDoc;

  if (review.consultantId !== consultant.uid) {
    return NextResponse.json({ error: "This case isn't assigned to you" }, { status: 403 });
  }
  if (review.status !== "payment_received") {
    return NextResponse.json({ error: "A review can only be submitted after payment is confirmed" }, { status: 409 });
  }

  const consultantRef = db.doc(firestorePaths.consultant(consultant.uid));
  const auditRef = db.collection(firestorePaths.auditLog(review.organizationId)).doc();
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.update(reviewRef, {
    report: {
      executiveSummary: body.executiveSummary.trim(),
      legalAnalysis: body.legalAnalysis.trim(),
      recommendation: body.recommendation.trim(),
      submittedAt: Timestamp.now(),
    },
    status: "review_submitted",
    updatedAt: now,
  });
  batch.update(consultantRef, { casesCompleted: FieldValue.increment(1) });
  batch.set(auditRef, {
    actorId: consultant.uid,
    action: "review_submitted",
    targetCollection: "expertReviews",
    targetId: params.id,
    timestamp: now,
  });
  await batch.commit();

  const ownerEmail = await getOrgOwnerEmail(review.organizationId);
  if (ownerEmail) {
    await sendReviewReadyEmail({ to: ownerEmail, consultantName: consultant.consultant.name }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
