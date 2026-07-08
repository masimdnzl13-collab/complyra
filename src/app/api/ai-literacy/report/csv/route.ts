import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type TrainingRecordDoc } from "@/lib/firestore/schema";
import { ROLE_LABELS, getModulesForRole } from "@/lib/ai-literacy/modules";

const CERTIFICATE_VALIDITY_DAYS = 365;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can export this report" }, { status: 403 });
  }

  const orgId = user.userDoc.organizationId;
  const snapshot = await getAdminFirestore().collection(firestorePaths.trainingRecords(orgId)).get();
  const records = snapshot.docs.map((d) => d.data() as TrainingRecordDoc);

  const header = ["Name", "Email", "Role", "Status", "Modules completed", "Modules required", "Completed on", "Certificate valid until"];
  const rows = records.map((r) => {
    const required = getModulesForRole(r.role);
    const completedCount = required.filter((m) => r.moduleProgress[m.id]?.passed).length;
    const status = r.completedAt ? "Completed" : completedCount > 0 ? "In progress" : "Not started";
    const completedDate = r.completedAt ? r.completedAt.toDate().toISOString().slice(0, 10) : "";
    const validUntil = r.completedAt
      ? new Date(r.completedAt.toDate().getTime() + CERTIFICATE_VALIDITY_DAYS * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)
      : "";
    return [
      r.userName,
      r.userEmail,
      ROLE_LABELS[r.role],
      status,
      String(completedCount),
      String(required.length),
      completedDate,
      validUntil,
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ai-literacy-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
