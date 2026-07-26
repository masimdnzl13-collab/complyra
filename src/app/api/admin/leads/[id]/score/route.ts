import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { firestorePaths, type DiscoveredLeadDoc } from "@/lib/firestore/schema";
import { scoreLeadWebsite } from "@/lib/leads/scoring";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await getCurrentSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.discoveredLead(params.id));
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const lead = snap.data() as DiscoveredLeadDoc;
  if (!lead.websiteUrl) {
    return NextResponse.json({ error: "This lead has no website URL to scan." }, { status: 400 });
  }

  const result = await scoreLeadWebsite(lead.websiteUrl);
  if ("blocked" in result) {
    return NextResponse.json({ error: "This site's robots.txt disallows scanning — could not be scored." }, { status: 200 });
  }

  await ref.update({
    aiUsageScore: result.score,
    scoreRationale: result.rationale,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, score: result.score, rationale: result.rationale });
}
