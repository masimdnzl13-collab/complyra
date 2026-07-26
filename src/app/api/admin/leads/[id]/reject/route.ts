import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { firestorePaths, type DiscoveredLeadDoc } from "@/lib/firestore/schema";

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
  if (lead.status !== "pending_review") {
    return NextResponse.json({ error: "This lead is not awaiting review." }, { status: 400 });
  }

  // Never deleted, per the project's archive-not-delete rule — just moved
  // out of the pipeline so it's never re-suggested by the discovery cron.
  await ref.update({ status: "rejected", updatedAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ ok: true });
}
