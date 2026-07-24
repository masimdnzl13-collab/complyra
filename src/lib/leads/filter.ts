import type { DiscoveredLeadStatus } from "@/lib/firestore/schema";
import { leadScoreBand, type LeadScoreBand } from "./constants";
import type { SerializedLead } from "./types";

export interface LeadFilters {
  city?: string;
  sector?: string;
  status?: DiscoveredLeadStatus;
  scoreBand?: LeadScoreBand;
}

export type LeadSortField = "companyName" | "city" | "sector" | "aiUsageScore" | "discoveredAt" | "status";
export type LeadSortDirection = "asc" | "desc";

/** Parses filters from a plain query-string record (used by both the client table and the export route, so on-screen filters and the exported file can never disagree). */
export function parseLeadFilters(params: Record<string, string | undefined>): LeadFilters {
  return {
    city: params.city || undefined,
    sector: params.sector || undefined,
    status: (params.status as DiscoveredLeadStatus) || undefined,
    scoreBand: (params.scoreBand as LeadScoreBand) || undefined,
  };
}

export function filterLeads(leads: SerializedLead[], filters: LeadFilters): SerializedLead[] {
  return leads.filter((lead) => {
    if (filters.city && lead.city !== filters.city) return false;
    if (filters.sector && lead.sector !== filters.sector) return false;
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.scoreBand && leadScoreBand(lead.aiUsageScore) !== filters.scoreBand) return false;
    return true;
  });
}

export function sortLeads(leads: SerializedLead[], field: LeadSortField, direction: LeadSortDirection): SerializedLead[] {
  const sorted = [...leads].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "companyName":
      case "city":
      case "sector":
      case "status":
        cmp = a[field].localeCompare(b[field]);
        break;
      case "aiUsageScore": {
        // Unscored leads sort to the end regardless of direction.
        if (a.aiUsageScore === null && b.aiUsageScore === null) cmp = 0;
        else if (a.aiUsageScore === null) return 1;
        else if (b.aiUsageScore === null) return -1;
        else cmp = a.aiUsageScore - b.aiUsageScore;
        break;
      }
      case "discoveredAt":
        cmp = a.discoveredAt.localeCompare(b.discoveredAt);
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}
