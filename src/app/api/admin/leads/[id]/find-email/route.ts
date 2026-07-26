import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { firestorePaths, type DiscoveredLeadDoc } from "@/lib/firestore/schema";
import { extractDomain, searchDomainEmails } from "@/lib/leads/hunter";

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
    return NextResponse.json({ error: "This lead has no website URL to search a domain for." }, { status: 400 });
  }
  const domain = extractDomain(lead.websiteUrl);
  if (!domain) {
    return NextResponse.json({ error: "Could not extract a domain from this lead's website URL." }, { status: 400 });
  }

  const outcome = await searchDomainEmails(domain);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.message }, { status: 200 });
  }

  const emailSearchNote = outcome.result.emails.length === 0 ? "No email found — manual check needed" : null;
  await ref.update({
    emails: outcome.result.emails,
    emailPattern: outcome.result.pattern,
    emailSearchNote,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    ok: true,
    emails: outcome.result.emails,
    pattern: outcome.result.pattern,
    emailSearchNote,
  });
}
