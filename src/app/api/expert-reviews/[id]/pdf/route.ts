import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type AiSystemDoc, type ConsultantDoc, type ExpertReviewDoc, type OrganizationDoc } from "@/lib/firestore/schema";
import { generateExpertReviewPdf } from "@/lib/consultant/generate-review-pdf";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const reviewSnap = await db.doc(firestorePaths.expertReview(params.id)).get();
  if (!reviewSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const review = reviewSnap.data() as ExpertReviewDoc;

  if (review.organizationId !== user.userDoc.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!review.report) {
    return NextResponse.json({ error: "No report yet" }, { status: 404 });
  }

  const [systemSnap, orgSnap, consultantSnap] = await Promise.all([
    db.doc(firestorePaths.aiSystem(review.organizationId, review.aiSystemId)).get(),
    db.doc(firestorePaths.organization(review.organizationId)).get(),
    review.consultantId ? db.doc(firestorePaths.consultant(review.consultantId)).get() : Promise.resolve(null),
  ]);
  const system = systemSnap.data() as AiSystemDoc | undefined;
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  const consultant = consultantSnap?.data() as ConsultantDoc | undefined;

  const pdfBytes = await generateExpertReviewPdf(
    review.report,
    consultant?.name ?? "Unknown consultant",
    system?.name ?? "Unknown system",
    organization?.companyName ?? "Unknown company"
  );

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="expert-review-${params.id}.pdf"`,
    },
  });
}
