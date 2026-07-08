import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkArticle50TextQuota } from "@/lib/article50/quota";
import { prepareArticle50ArtifactWrite } from "@/lib/article50/persist-artifact";
import { generateDeepfakeDisclosureText, generatePublicInterestDisclosureText } from "@/lib/article50/claude-client";
import type { DeepfakeArtifactType } from "@/lib/article50/types";

const ARTIFACT_TYPES = new Set<DeepfakeArtifactType>(["deepfake", "public_interest_text", "both"]);

interface RequestBody {
  artifactType: DeepfakeArtifactType;
  isArtisticOrSatirical: boolean;
  publicInterestContentDescription?: string;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.artifactType !== "string" || !ARTIFACT_TYPES.has(b.artifactType as DeepfakeArtifactType)) return false;
  if (typeof b.isArtisticOrSatirical !== "boolean") return false;
  if (b.publicInterestContentDescription !== undefined && typeof b.publicInterestContentDescription !== "string") {
    return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can generate disclosure text" }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`article50-deepfake:${ip}`, 15, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const orgRef = db.doc(firestorePaths.organization(orgId));
  const orgSnap = await orgRef.get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const quota = checkArticle50TextQuota(organization);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.error }, { status: 403 });
  }

  let deepfakeText: string | null = null;
  let publicInterestText: string | null = null;

  if (body.artifactType === "deepfake" || body.artifactType === "both") {
    deepfakeText = await generateDeepfakeDisclosureText({
      companyName: organization.companyName,
      isArtisticOrSatirical: body.isArtisticOrSatirical,
    });
  }
  if (body.artifactType === "public_interest_text" || body.artifactType === "both") {
    publicInterestText = await generatePublicInterestDisclosureText({
      companyName: organization.companyName,
      contentDescription: body.publicInterestContentDescription ?? "AI-generated analysis or policy text",
    });
  }

  const { batch, artifactId } = await prepareArticle50ArtifactWrite({
    orgId,
    area: "deepfake_disclosure",
    aiSystemId: null,
    title: `Deepfake / public-interest disclosure (${body.artifactType.replace(/_/g, " ")})`,
    data: {
      artifactType: body.artifactType,
      isArtisticOrSatirical: body.isArtisticOrSatirical,
      deepfakeText,
      publicInterestText,
    },
    actorUid: user.uid,
  });

  batch.update(orgRef, {
    "usage.article50TextsThisMonth": quota.monthIsStale ? 1 : FieldValue.increment(1),
    "usage.usageMonthKey": quota.currentMonthKey,
  });

  await batch.commit();

  return NextResponse.json({ ok: true, id: artifactId });
}
