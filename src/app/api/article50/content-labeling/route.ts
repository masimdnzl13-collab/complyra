import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type OrganizationDoc } from "@/lib/firestore/schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkArticle50TextQuota } from "@/lib/article50/quota";
import { prepareArticle50ArtifactWrite } from "@/lib/article50/persist-artifact";
import { generateContentLabelText } from "@/lib/article50/claude-client";
import type { ContentType, PublishPlatform } from "@/lib/article50/types";

const CONTENT_TYPES = new Set<ContentType>(["text", "image", "audio", "video"]);
const PLATFORMS = new Set<PublishPlatform>(["website", "social_media", "news_platform", "other"]);

interface RequestBody {
  contentTypes: ContentType[];
  platform: PublishPlatform;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.contentTypes) &&
    b.contentTypes.length > 0 &&
    b.contentTypes.every((t) => typeof t === "string" && CONTENT_TYPES.has(t as ContentType)) &&
    typeof b.platform === "string" &&
    PLATFORMS.has(b.platform as PublishPlatform)
  );
}

const IMPLEMENTATION_CHECKLIST = [
  { id: "marks_before_publish", label: "Does the system label every AI-generated output before it's published?" },
  { id: "label_in_description_too", label: "Is the label only in the title/caption, or also in the description?" },
  { id: "translated_to_all_languages", label: "Has the label been translated into every language you publish in?" },
];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can generate labeling templates" }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`article50-labeling:${ip}`, 15, 10 * 60 * 1000)) {
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

  const labelText = await generateContentLabelText({
    platform: body.platform,
    contentTypes: body.contentTypes,
    companyName: organization.companyName,
  });

  const { batch, artifactId } = await prepareArticle50ArtifactWrite({
    orgId,
    area: "content_labeling",
    aiSystemId: null,
    title: `Content labeling — ${body.platform.replace(/_/g, " ")}`,
    data: {
      contentTypes: body.contentTypes,
      platform: body.platform,
      labelText,
      checklist: IMPLEMENTATION_CHECKLIST.map((item) => ({ ...item, checked: false })),
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
