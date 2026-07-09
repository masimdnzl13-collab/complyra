import "server-only";
import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";

/** LemonSqueezy doesn't expose a delivery-unique event ID in the payload, so a retried (identical) body hashes the same, while a genuinely new event — even for the same resource — differs (different timestamps/status) and hashes differently. */
export function hashPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

/**
 * Atomic "claim this event ID" check via Firestore's create-if-absent
 * semantics — `.create()` throws if the doc already exists, so two
 * concurrent redeliveries of the same event can't both pass. Returns true
 * the first time an event is seen (caller should process it), false on
 * every redelivery (caller should skip processing but still return 2xx).
 */
export async function claimWebhookEvent(source: "lemonsqueezy" | "stripe", eventId: string): Promise<boolean> {
  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.processedWebhookEvent(`${source}:${eventId}`));
  try {
    await ref.create({ source, eventId, processedAt: FieldValue.serverTimestamp() });
    return true;
  } catch {
    return false;
  }
}
