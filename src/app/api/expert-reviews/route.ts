import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  firestorePaths,
  type AiSystemDoc,
  type AssessmentDoc,
  type ConsultantDoc,
  type ConsultantLanguagePreference,
  type OrganizationDoc,
  type PreferredTurnaround,
} from "@/lib/firestore/schema";
import { planHasExpertReviewAccess } from "@/config/site";
import { checkPastDue } from "@/lib/billing/quota";
import { sendNewCaseNotificationEmail } from "@/lib/email/send-consultant-invite-email";

const TURNAROUNDS: PreferredTurnaround[] = ["24h", "2d", "1w"];
const LANGUAGE_PREFS: ConsultantLanguagePreference[] = ["en", "de", "tr", "any"];
const TURNAROUND_LABELS: Record<PreferredTurnaround, string> = { "24h": "24 hours", "2d": "2 days", "1w": "1 week" };
const MATCHED_CONSULTANTS_TO_NOTIFY = 3;

interface RequestBody {
  assessmentId: string;
  userNotes: string;
  preferredTurnaround: PreferredTurnaround;
  languagePreference: ConsultantLanguagePreference;
  budgetCeiling: number | null;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.assessmentId === "string" &&
    typeof b.userNotes === "string" &&
    b.userNotes.trim().length > 0 &&
    TURNAROUNDS.includes(b.preferredTurnaround as PreferredTurnaround) &&
    LANGUAGE_PREFS.includes(b.languagePreference as ConsultantLanguagePreference) &&
    (b.budgetCeiling === null || (typeof b.budgetCeiling === "number" && b.budgetCeiling > 0))
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can request an expert review" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const [orgSnap, assessmentSnap] = await Promise.all([
    db.doc(firestorePaths.organization(orgId)).get(),
    db.doc(firestorePaths.assessment(orgId, body.assessmentId)).get(),
  ]);
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  if (!assessmentSnap.exists) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  const assessment = assessmentSnap.data() as AssessmentDoc;

  if (!planHasExpertReviewAccess(organization.subscription.planId)) {
    return NextResponse.json({ error: "Upgrade to Growth for expert review" }, { status: 403 });
  }
  const pastDue = checkPastDue(organization);
  if (pastDue) return NextResponse.json({ error: pastDue }, { status: 403 });

  const systemSnap = await db.doc(firestorePaths.aiSystem(orgId, assessment.aiSystemId)).get();
  const system = systemSnap.data() as AiSystemDoc | undefined;

  const orgRef = db.doc(firestorePaths.organization(orgId));
  const reviewRef = db.collection(firestorePaths.expertReviews()).doc();
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.set(reviewRef, {
    organizationId: orgId,
    assessmentId: body.assessmentId,
    aiSystemId: assessment.aiSystemId,
    requestedBy: user.uid,
    status: "pending_assignment",
    userNotes: body.userNotes.trim(),
    preferredTurnaround: body.preferredTurnaround,
    languagePreference: body.languagePreference,
    budgetCeiling: body.budgetCeiling,
    consultantId: null,
    proposal: null,
    stripeCheckoutSessionId: null,
    commissionAmount: null,
    paymentReceivedAt: null,
    report: null,
    rating: null,
    flaggedForQualityReview: false,
    createdAt: now,
    updatedAt: now,
  });
  batch.update(orgRef, { "usage.expertReviewsThisMonth": FieldValue.increment(1) });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "expert_review_requested",
    targetCollection: "expertReviews",
    targetId: reviewRef.id,
    timestamp: now,
  });
  await batch.commit();

  // Notify matching active, available consultants — filtered by language if
  // the user asked for one, ranked by rating, best-effort (a failed send
  // here shouldn't fail the request that already succeeded).
  try {
    let consultantsQuery = db
      .collection(firestorePaths.consultants())
      .where("approvalStatus", "==", "active")
      .where("isAvailable", "==", true);
    if (body.languagePreference !== "any") {
      consultantsQuery = consultantsQuery.where("languages", "array-contains", body.languagePreference);
    }
    const consultantsSnap = await consultantsQuery.get();
    const matched = consultantsSnap.docs
      .map((d) => d.data() as ConsultantDoc)
      .sort((a, b) => b.ratingAverage - a.ratingAverage)
      .slice(0, MATCHED_CONSULTANTS_TO_NOTIFY);

    await Promise.all(
      matched.map((c) =>
        sendNewCaseNotificationEmail({
          to: c.email,
          organizationName: organization.companyName,
          briefSummary: `${system?.name ?? "AI system"} — ${body.userNotes.trim().slice(0, 200)}`,
          preferredTurnaround: TURNAROUND_LABELS[body.preferredTurnaround],
        }).catch(() => {})
      )
    );
  } catch {
    // Best-effort notification — the request itself already succeeded.
  }

  return NextResponse.json({ ok: true, id: reviewRef.id });
}
