import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type AiSystemDoc, type AssessmentDoc, type OrganizationDoc } from "@/lib/firestore/schema";
import { generateAssessmentPdf } from "@/lib/risk-assessment/generate-pdf";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const assessmentSnap = await db.doc(firestorePaths.assessment(orgId, params.id)).get();
  if (!assessmentSnap.exists) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }
  const assessment = assessmentSnap.data() as AssessmentDoc;

  const [systemSnap, orgSnap] = await Promise.all([
    db.doc(firestorePaths.aiSystem(orgId, assessment.aiSystemId)).get(),
    db.doc(firestorePaths.organization(orgId)).get(),
  ]);
  const system = systemSnap.data() as AiSystemDoc | undefined;
  const organization = orgSnap.data() as OrganizationDoc | undefined;

  const pdfBytes = await generateAssessmentPdf(
    assessment,
    system?.name ?? "Unknown system",
    organization?.companyName ?? "Unknown company"
  );

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="risk-assessment-${params.id}.pdf"`,
    },
  });
}
