import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type Article50Artifact } from "@/lib/firestore/schema";
import { generateArticle50Pdf } from "@/lib/article50/generate-pdf";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const snap = await db.doc(firestorePaths.article50Artifact(orgId, params.id)).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const artifact = snap.data() as Article50Artifact;

  const pdfBytes = await generateArticle50Pdf(artifact);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="article-50-${artifact.area}-${params.id}.pdf"`,
    },
  });
}
