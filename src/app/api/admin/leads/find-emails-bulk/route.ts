import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { firestorePaths, type DiscoveredLeadDoc } from "@/lib/firestore/schema";
import { extractDomain, getHunterAccountStatus, searchDomainEmails } from "@/lib/leads/hunter";
import { MAX_BULK_EMAIL_LOOKUPS_PER_RUN } from "@/lib/leads/enrichment-limits";

export async function POST() {
  const admin = await getCurrentSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const status = await getHunterAccountStatus();
  if (status && status.available <= 0) {
    return NextResponse.json(
      { error: "This month's Hunter.io search allowance has been used up.", attempted: 0, found: 0, notFound: 0, quotaStoppedEarly: true },
      { status: 200 }
    );
  }

  const db = getAdminFirestore();
  const snap = await db.collection(firestorePaths.discoveredLeads()).get();
  const candidates = snap.docs.filter((doc) => {
    const lead = doc.data() as DiscoveredLeadDoc;
    return !!lead.websiteUrl && lead.emails.length === 0;
  });

  const cap = status ? Math.min(status.available, MAX_BULK_EMAIL_LOOKUPS_PER_RUN) : MAX_BULK_EMAIL_LOOKUPS_PER_RUN;
  const toProcess = candidates.slice(0, cap);

  let found = 0;
  let notFound = 0;
  let quotaStoppedEarly = false;

  for (const doc of toProcess) {
    const lead = doc.data() as DiscoveredLeadDoc;
    const domain = extractDomain(lead.websiteUrl!);
    if (!domain) {
      notFound++;
      continue;
    }

    const outcome = await searchDomainEmails(domain);
    if (!outcome.ok) {
      if (outcome.reason === "quota_exceeded" || outcome.reason === "rate_limited") {
        quotaStoppedEarly = true;
        break;
      }
      notFound++;
      continue;
    }

    const emailSearchNote = outcome.result.emails.length === 0 ? "No email found — manual check needed" : null;
    await doc.ref.update({
      emails: outcome.result.emails,
      emailPattern: outcome.result.pattern,
      emailSearchNote,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (outcome.result.emails.length > 0) found++;
    else notFound++;
  }

  return NextResponse.json({
    ok: true,
    attempted: toProcess.length,
    found,
    notFound,
    quotaStoppedEarly,
    remainingCandidates: candidates.length - toProcess.length,
  });
}
