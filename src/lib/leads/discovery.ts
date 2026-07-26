import { DISCOVERY_CITIES, DISCOVERY_SECTORS } from "./discovery-config";

export interface DiscoveryTarget {
  city: string;
  sector: string;
}

/**
 * Picks the least-represented city/sector pair from the fixed candidate
 * lists, based on how many existing leads already fall into each — this is
 * the "22 leads from Kayseri, 80 from İstanbul, look at Gaziantep next"
 * diversification logic. Pure and deterministic given the same lead list.
 */
export function pickDiscoveryTarget(existingLeads: { city: string; sector: string }[]): DiscoveryTarget {
  const cityCounts = new Map<string, number>(DISCOVERY_CITIES.map((c) => [c, 0]));
  const sectorCounts = new Map<string, number>(DISCOVERY_SECTORS.map((s) => [s, 0]));

  for (const lead of existingLeads) {
    if (cityCounts.has(lead.city)) cityCounts.set(lead.city, (cityCounts.get(lead.city) ?? 0) + 1);
    if (sectorCounts.has(lead.sector)) sectorCounts.set(lead.sector, (sectorCounts.get(lead.sector) ?? 0) + 1);
  }

  const leastRepresented = (counts: Map<string, number>): string => {
    let best = "";
    let bestCount = Infinity;
    Array.from(counts.entries()).forEach(([key, count]) => {
      if (count < bestCount) {
        best = key;
        bestCount = count;
      }
    });
    return best;
  };

  return { city: leastRepresented(cityCounts), sector: leastRepresented(sectorCounts) };
}
