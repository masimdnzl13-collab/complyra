import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type ComplianceDocumentDoc } from "@/lib/firestore/schema";
import { generateDocumentPdf } from "@/lib/documents/generate-pdf";

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
  const snap = await db.doc(firestorePaths.document(orgId, params.id)).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const document = snap.data() as ComplianceDocumentDoc;

  const pdfBytes = await generateDocumentPdf(document);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.type}-v${document.version}-${params.id}.pdf"`,
    },
  });
}
