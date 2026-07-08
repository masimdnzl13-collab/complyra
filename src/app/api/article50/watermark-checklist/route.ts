import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prepareArticle50ArtifactWrite } from "@/lib/article50/persist-artifact";
import type { GenerativeModelSource, WatermarkCapability } from "@/lib/article50/types";

const MODEL_SOURCES = new Set<GenerativeModelSource>(["openai", "meta", "own_model", "other"]);
const CAPABILITIES = new Set<WatermarkCapability>(["yes", "partial", "no"]);

interface RequestBody {
  modelSource: GenerativeModelSource;
  watermarkCapability: WatermarkCapability;
  vendorCommitmentDocumented: boolean;
  standardSelected: boolean;
  outputFilesVerified: boolean;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.modelSource === "string" &&
    MODEL_SOURCES.has(b.modelSource as GenerativeModelSource) &&
    typeof b.watermarkCapability === "string" &&
    CAPABILITIES.has(b.watermarkCapability as WatermarkCapability) &&
    typeof b.vendorCommitmentDocumented === "boolean" &&
    typeof b.standardSelected === "boolean" &&
    typeof b.outputFilesVerified === "boolean"
  );
}

/**
 * Pure checklist — no Claude call, so it's plan-agnostic (available on
 * Free) and doesn't consume the article50TextsPerMonth quota, unlike the
 * other three areas.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can update the watermark checklist" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const { batch, artifactId } = await prepareArticle50ArtifactWrite({
    orgId,
    area: "watermark_checklist",
    aiSystemId: null,
    title: "Machine-readable watermark checklist",
    data: { ...body },
    actorUid: user.uid,
  });

  await batch.commit();

  return NextResponse.json({ ok: true, id: artifactId });
}
