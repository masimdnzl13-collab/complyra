import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { firestorePaths, type DiscoveredLeadDoc } from "@/lib/firestore/schema";
import { scoreLeadWebsite } from "@/lib/leads/scoring";
import { MAX_BULK_SCORE_SCANS_PER_RUN } from "@/lib/leads/enrichment-limits";

export async function POST() {
  const admin = await getCurrentSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(firestorePaths.discoveredLeads()).get();
  const candidates = snap.docs.filter((doc) => {
    const lead = doc.data() as DiscoveredLeadDoc;
    return !!lead.websiteUrl && lead.aiUsageScore === null;
  });

  const toProcess = candidates.slice(0, MAX_BULK_SCORE_SCANS_PER_RUN);
  let scored = 0;
  let blocked = 0;
  let failed = 0;

  for (const doc of toProcess) {
    const lead = doc.data() as DiscoveredLeadDoc;
    try {
      const result = await scoreLeadWebsite(lead.websiteUrl!);
      if ("blocked" in result) {
        blocked++;
        continue;
      }
      await doc.ref.update({
        aiUsageScore: result.score,
        scoreRationale: result.rationale,
        updatedAt: FieldValue.serverTimestamp(),
      });
      scored++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    attempted: toProcess.length,
    scored,
    blocked,
    failed,
    remainingCandidates: candidates.length - toProcess.length,
  });
}
