import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type DiscoveredLeadDoc } from "@/lib/firestore/schema";
import { scoreLeadWebsite } from "./scoring";
import { extractDomain, searchDomainEmails } from "./hunter";

/**
 * Runs P2 (email discovery) and P3 (scoring) for one lead — the "approved
 * candidates automatically go through enrichment" hook from P4. Each step
 * is independently best-effort: a failure in one never blocks the other,
 * and a failure here never blocks the approval itself (callers should
 * still consider the approval successful even if this throws nothing but
 * silently enriches less than hoped).
 */
export async function enrichLead(leadId: string): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.discoveredLead(leadId));
  const snap = await ref.get();
  if (!snap.exists) return;

  const lead = snap.data() as DiscoveredLeadDoc;
  if (!lead.websiteUrl) return;

  const updates: Record<string, unknown> = {};

  try {
    const scoring = await scoreLeadWebsite(lead.websiteUrl);
    if (!("blocked" in scoring)) {
      updates.aiUsageScore = scoring.score;
      updates.scoreRationale = scoring.rationale;
    }
  } catch {
    // Best-effort — leave aiUsageScore unset rather than fail the approval.
  }

  try {
    const domain = extractDomain(lead.websiteUrl);
    if (domain) {
      const outcome = await searchDomainEmails(domain);
      if (outcome.ok) {
        updates.emails = outcome.result.emails;
        updates.emailPattern = outcome.result.pattern;
        updates.emailSearchNote = outcome.result.emails.length === 0 ? "No email found — manual check needed" : null;
      }
    }
  } catch {
    // Best-effort — leave emails unset rather than fail the approval.
  }

  if (Object.keys(updates).length > 0) {
    await ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
  }
}
