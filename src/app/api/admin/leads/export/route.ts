import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { firestorePaths } from "@/lib/firestore/schema";
import { filterLeads, parseLeadFilters, sortLeads, type LeadSortDirection, type LeadSortField } from "@/lib/leads/filter";
import { leadScoreBand } from "@/lib/leads/constants";
import { serializeLeadDoc } from "@/lib/leads/serialize";

const SCORE_BAND_FILL: Record<string, string> = {
  high: "FFD1FAE5",
  medium: "FFFFEDD5",
  low: "FFE5E7EB",
  unscored: "FFE5E7EB",
};

export async function GET(request: NextRequest) {
  const admin = await getCurrentSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filters = parseLeadFilters({
    city: searchParams.get("city") ?? undefined,
    sector: searchParams.get("sector") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    scoreBand: searchParams.get("scoreBand") ?? undefined,
  });
  const sortField = (searchParams.get("sortField") as LeadSortField) || "discoveredAt";
  const sortDirection = (searchParams.get("sortDirection") as LeadSortDirection) || "desc";

  const db = getAdminFirestore();
  const snap = await db.collection(firestorePaths.discoveredLeads()).get();
  const leads = sortLeads(filterLeads(snap.docs.map(serializeLeadDoc), filters), sortField, sortDirection);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Leads");
  sheet.columns = [
    { header: "Company", key: "companyName", width: 32 },
    { header: "City", key: "city", width: 16 },
    { header: "Sector", key: "sector", width: 20 },
    { header: "Emails", key: "emails", width: 40 },
    { header: "AI usage score", key: "aiUsageScore", width: 14 },
    { header: "Score rationale", key: "scoreRationale", width: 50 },
    { header: "Source", key: "discoverySource", width: 22 },
    { header: "Discovered", key: "discoveredAt", width: 14 },
    { header: "Status", key: "status", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const lead of leads) {
    const row = sheet.addRow({
      companyName: lead.companyName,
      city: lead.city,
      sector: lead.sector,
      emails: lead.emails.map((e) => `${e.address} (${e.confidence})`).join("; "),
      aiUsageScore: lead.aiUsageScore ?? "",
      scoreRationale: (lead.scoreRationale ?? []).join("; "),
      discoverySource: lead.discoverySource,
      discoveredAt: lead.discoveredAt.slice(0, 10),
      status: lead.status,
    });

    const band = leadScoreBand(lead.aiUsageScore);
    const scoreCell = row.getCell("aiUsageScore");
    scoreCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SCORE_BAND_FILL[band] } };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="vermoncy-leads-${date}.xlsx"`,
    },
  });
}
