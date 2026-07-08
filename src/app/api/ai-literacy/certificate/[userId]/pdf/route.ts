import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc, type TrainingRecordDoc } from "@/lib/firestore/schema";
import { generateCertificatePdf } from "@/lib/ai-literacy/generate-certificate";

interface RouteParams {
  params: { userId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const isSelf = user.uid === params.userId;
  const isOwner = user.userDoc.role === "owner";
  if (!isSelf && !isOwner) {
    return NextResponse.json({ error: "Not authorized to view this certificate" }, { status: 403 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const [recordSnap, orgSnap] = await Promise.all([
    db.doc(firestorePaths.trainingRecord(orgId, params.userId)).get(),
    db.doc(firestorePaths.organization(orgId)).get(),
  ]);

  if (!recordSnap.exists) return NextResponse.json({ error: "Training record not found" }, { status: 404 });
  const record = recordSnap.data() as TrainingRecordDoc;
  if (!record.completedAt) {
    return NextResponse.json({ error: "Training is not yet complete" }, { status: 403 });
  }
  const organization = orgSnap.data() as OrganizationDoc | undefined;

  const pdfBytes = await generateCertificatePdf(record, organization?.companyName ?? "");

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ai-literacy-certificate-${params.userId}.pdf"`,
    },
  });
}
