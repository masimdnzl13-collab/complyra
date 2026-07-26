import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type DiscoveredLeadDoc } from "@/lib/firestore/schema";
import { authorizeCronRequest } from "@/lib/cron/authorize";
import { withCronRunLogging } from "@/lib/cron/log-run";
import { pickDiscoveryTarget } from "@/lib/leads/discovery";
import { discoverLeadCandidates } from "@/lib/leads/discover-candidates";

export async function GET(request: NextRequest) {
  const auth = await authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await withCronRunLogging("lead-discovery", auth.triggeredBy, async (counters) => {
    const db = getAdminFirestore();
    const existingSnap = await db.collection(firestorePaths.discoveredLeads()).get();
    const existingLeads = existingSnap.docs.map((d) => d.data() as DiscoveredLeadDoc);
    const existingNames = new Set(existingLeads.map((l) => l.companyNameLower));

    const { city, sector } = pickDiscoveryTarget(existingLeads);
    const candidates = await discoverLeadCandidates(city, sector);
    counters.processedCount = candidates.length;

    const todayKey = new Date().toISOString().slice(0, 10);
    const batch = db.batch();
    let newCandidatesAdded = 0;

    for (const candidate of candidates) {
      const companyNameLower = candidate.companyName.trim().toLowerCase();
      if (!companyNameLower || existingNames.has(companyNameLower)) continue;
      existingNames.add(companyNameLower);

      const ref = db.collection(firestorePaths.discoveredLeads()).doc();
      batch.set(ref, {
        companyName: candidate.companyName.trim(),
        companyNameLower,
        city,
        sector,
        websiteUrl: candidate.websiteUrl,
        emails: [],
        emailPattern: null,
        aiUsageScore: null,
        scoreRationale: null,
        discoverySource: `auto-scan-${todayKey}`,
        discoverySourceUrl: candidate.sourceUrl,
        discoveredAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        status: "pending_review",
        contactHint: null,
        manualPriority: null,
        notes: candidate.note,
        emailSearchNote: null,
      });
      newCandidatesAdded++;
    }

    if (newCandidatesAdded > 0) await batch.commit();

    return {
      ok: true,
      city,
      sector,
      candidatesFound: candidates.length,
      newCandidatesAdded,
    };
  });

  return NextResponse.json(result);
}
