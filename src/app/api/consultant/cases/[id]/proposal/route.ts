import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentConsultant } from "@/lib/auth/current-consultant";
import { firestorePaths, type ExpertReviewDoc } from "@/lib/firestore/schema";
import { getOrgOwnerEmail } from "@/lib/billing/org-owner";
import { sendProposalReceivedEmail } from "@/lib/email/send-expert-review-email";

interface RouteParams {
  params: { id: string };
}

interface ProposalInput {
  hourlyRate: number;
  estimatedTotal: number;
  deliveryFormat: string;
  scopeDescription: string;
}

function isValidProposal(body: unknown): body is ProposalInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.hourlyRate === "number" &&
    b.hourlyRate > 0 &&
    typeof b.estimatedTotal === "number" &&
    b.estimatedTotal > 0 &&
    typeof b.deliveryFormat === "string" &&
    b.deliveryFormat.trim().length > 0 &&
    typeof b.scopeDescription === "string" &&
    b.scopeDescription.trim().length > 0
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidProposal(body)) {
    return NextResponse.json({ error: "Please complete every field" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const reviewRef = db.doc(firestorePaths.expertReview(params.id));
  const reviewSnap = await reviewRef.get();
  if (!reviewSnap.exists) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  const review = reviewSnap.data() as ExpertReviewDoc;

  if (review.consultantId !== consultant.uid) {
    return NextResponse.json({ error: "This case isn't assigned to you" }, { status: 403 });
  }
  if (review.status !== "accepted" && review.status !== "proposal_declined") {
    return NextResponse.json({ error: "A proposal can't be sent at this stage" }, { status: 409 });
  }
  if (review.budgetCeiling && body.estimatedTotal > review.budgetCeiling) {
    return NextResponse.json({ error: `The client's budget ceiling is €${review.budgetCeiling}` }, { status: 400 });
  }

  await reviewRef.update({
    proposal: {
      hourlyRate: body.hourlyRate,
      estimatedTotal: body.estimatedTotal,
      deliveryFormat: body.deliveryFormat.trim(),
      scopeDescription: body.scopeDescription.trim(),
      sentAt: Timestamp.now(),
    },
    status: "proposal_sent",
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection(firestorePaths.auditLog(review.organizationId)).add({
    actorId: consultant.uid,
    action: "proposal_sent",
    targetCollection: "expertReviews",
    targetId: params.id,
    timestamp: FieldValue.serverTimestamp(),
  });

  const ownerEmail = await getOrgOwnerEmail(review.organizationId);
  if (ownerEmail) {
    await sendProposalReceivedEmail({
      to: ownerEmail,
      consultantName: consultant.consultant.name,
      estimatedTotal: `€${body.estimatedTotal}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
