import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { firestorePaths } from "@/lib/firestore/schema";
import { parseLeadCsv } from "@/lib/leads/csv";

const BATCH_CHUNK_SIZE = 400;

export async function POST(request: NextRequest) {
  const admin = await getCurrentSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No CSV file was uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const { rows, skipped } = parseLeadCsv(text);
  if (rows.length === 0) {
    return NextResponse.json({ created: 0, updated: 0, skipped });
  }

  const db = getAdminFirestore();
  const collectionRef = db.collection(firestorePaths.discoveredLeads());

  // One projection query to map existing companies to their doc IDs, so a
  // re-import upserts instead of creating duplicates.
  const existingSnap = await collectionRef.select("companyNameLower").get();
  const existingByName = new Map<string, string>();
  for (const doc of existingSnap.docs) {
    existingByName.set(doc.get("companyNameLower") as string, doc.id);
  }

  let created = 0;
  let updated = 0;
  const now = FieldValue.serverTimestamp();

  for (let i = 0; i < rows.length; i += BATCH_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = db.batch();

    for (const row of chunk) {
      const companyNameLower = row.company_name.trim().toLowerCase();
      const existingId = existingByName.get(companyNameLower);

      if (existingId) {
        batch.set(
          collectionRef.doc(existingId),
          {
            city: row.city,
            sector: row.sector,
            websiteUrl: row.source_url || null,
            contactHint: row.contact_hint || null,
            manualPriority: row.priority || null,
            notes: row.notes || null,
            updatedAt: now,
          },
          { merge: true }
        );
        updated++;
      } else {
        const ref = collectionRef.doc();
        batch.set(ref, {
          companyName: row.company_name,
          companyNameLower,
          city: row.city,
          sector: row.sector,
          websiteUrl: row.source_url || null,
          emails: [],
          aiUsageScore: null,
          scoreRationale: null,
          discoverySource: "manual-csv-import",
          discoveredAt: now,
          updatedAt: now,
          status: "new",
          contactHint: row.contact_hint || null,
          manualPriority: row.priority || null,
          notes: row.notes || null,
          emailSearchNote: null,
        });
        // Track within this import batch too, in case the same company name
        // appears twice in one CSV — the second occurrence should update,
        // not create a second doc.
        existingByName.set(companyNameLower, ref.id);
        created++;
      }
    }

    await batch.commit();
  }

  return NextResponse.json({ created, updated, skipped });
}
