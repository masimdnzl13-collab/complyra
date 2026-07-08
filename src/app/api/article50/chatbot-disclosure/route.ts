import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type AiSystemDoc, type OrganizationDoc } from "@/lib/firestore/schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkArticle50TextQuota } from "@/lib/article50/quota";
import { prepareArticle50ArtifactWrite } from "@/lib/article50/persist-artifact";
import { generateChatbotDisclosureTexts } from "@/lib/article50/claude-client";
import type { InteractionType, Language, NoticeFormat } from "@/lib/article50/types";

const LANGUAGES = new Set<Language>(["en", "de", "tr", "fr", "es"]);
const INTERACTION_TYPES = new Set<InteractionType>(["text_chat", "voice_phone", "voice_assistant", "video"]);
const NOTICE_FORMATS = new Set<NoticeFormat>(["text_dropdown", "text_visible", "voice_and_text"]);

interface RequestBody {
  systemId: string;
  languages: Language[];
  interactionType: InteractionType;
  noticeFormat: NoticeFormat;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.systemId === "string" &&
    b.systemId.length > 0 &&
    Array.isArray(b.languages) &&
    b.languages.length > 0 &&
    b.languages.every((l) => typeof l === "string" && LANGUAGES.has(l as Language)) &&
    typeof b.interactionType === "string" &&
    INTERACTION_TYPES.has(b.interactionType as InteractionType) &&
    typeof b.noticeFormat === "string" &&
    NOTICE_FORMATS.has(b.noticeFormat as NoticeFormat)
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can generate disclosure notices" }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`article50-chatbot:${ip}`, 15, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const systemSnap = await db.doc(firestorePaths.aiSystem(orgId, body.systemId)).get();
  if (!systemSnap.exists) {
    return NextResponse.json({ error: "AI system not found" }, { status: 404 });
  }
  const system = systemSnap.data() as AiSystemDoc;

  const orgRef = db.doc(firestorePaths.organization(orgId));
  const orgSnap = await orgRef.get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const quota = checkArticle50TextQuota(organization);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.error }, { status: 403 });
  }

  const texts = await generateChatbotDisclosureTexts({
    systemName: system.name,
    systemDescription: system.description,
    interactionType: body.interactionType,
    noticeFormat: body.noticeFormat,
    languages: body.languages,
  });

  const { batch, artifactId } = await prepareArticle50ArtifactWrite({
    orgId,
    area: "chatbot_disclosure",
    aiSystemId: body.systemId,
    title: `Chatbot disclosure — ${system.name}`,
    data: { languages: body.languages, interactionType: body.interactionType, noticeFormat: body.noticeFormat, texts },
    actorUid: user.uid,
  });

  batch.update(orgRef, {
    "usage.article50TextsThisMonth": quota.monthIsStale ? 1 : FieldValue.increment(1),
    "usage.usageMonthKey": quota.currentMonthKey,
  });

  await batch.commit();

  return NextResponse.json({ ok: true, id: artifactId });
}
