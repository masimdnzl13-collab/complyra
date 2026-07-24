import type { DiscoveredLeadDoc } from "@/lib/firestore/schema";

/**
 * `DiscoveredLeadDoc` with Firestore Timestamp fields flattened to ISO
 * strings — the shape passed from server components to client components
 * (which can't receive Timestamp class instances as props) and returned by
 * the export route's filter/sort pass.
 */
export interface SerializedLead extends Omit<DiscoveredLeadDoc, "discoveredAt" | "updatedAt"> {
  id: string;
  discoveredAt: string;
  updatedAt: string;
}
