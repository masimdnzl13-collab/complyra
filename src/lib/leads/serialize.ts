import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { DiscoveredLeadDoc } from "@/lib/firestore/schema";
import type { SerializedLead } from "./types";

export function serializeLeadDoc(doc: QueryDocumentSnapshot): SerializedLead {
  const data = doc.data() as DiscoveredLeadDoc;
  return {
    ...data,
    id: doc.id,
    discoveredAt: data.discoveredAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}
