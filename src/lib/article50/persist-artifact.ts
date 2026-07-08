import "server-only";
import { FieldValue, type WriteBatch } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type Article50Area, type Article50Artifact } from "@/lib/firestore/schema";

interface PersistParams {
  orgId: string;
  area: Article50Area;
  aiSystemId: string | null;
  title: string;
  data: Record<string, unknown>;
  actorUid: string;
}

/**
 * Prepares (but does not commit) the batch that archives the prior current
 * artifact for this (area, aiSystemId) pair and writes the new version plus
 * its audit log entry — callers add any usage-counter updates to the same
 * batch before committing, so the whole write stays atomic.
 */
export async function prepareArticle50ArtifactWrite({
  orgId,
  area,
  aiSystemId,
  title,
  data,
  actorUid,
}: PersistParams): Promise<{ batch: WriteBatch; artifactId: string }> {
  const db = getAdminFirestore();
  const existing = await db
    .collection(firestorePaths.article50Artifacts(orgId))
    .where("area", "==", area)
    .where("aiSystemId", "==", aiSystemId)
    .get();
  const prior = existing.docs.find((d) => (d.data() as Article50Artifact).isCurrent);
  const nextVersion =
    existing.docs.reduce((max, d) => Math.max(max, (d.data() as Article50Artifact).version), 0) + 1;

  const now = FieldValue.serverTimestamp();
  const artifactRef = db.collection(firestorePaths.article50Artifacts(orgId)).doc();
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();

  const batch = db.batch();
  if (prior) batch.update(prior.ref, { isCurrent: false });
  batch.set(artifactRef, {
    area,
    aiSystemId,
    version: nextVersion,
    isCurrent: true,
    status: "draft",
    title,
    data,
    createdAt: now,
    updatedAt: now,
    createdBy: actorUid,
  });
  batch.set(auditRef, {
    actorId: actorUid,
    action: "record_created",
    targetCollection: "article50Artifacts",
    targetId: artifactRef.id,
    timestamp: now,
    metadata: { area, title },
  });

  return { batch, artifactId: artifactRef.id };
}
