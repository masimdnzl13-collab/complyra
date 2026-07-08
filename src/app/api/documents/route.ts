import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  firestorePaths,
  type AiSystemDoc,
  type AssessmentDoc,
  type ComplianceDocumentType,
  type OrganizationDoc,
} from "@/lib/firestore/schema";
import { checkMonthlyQuota } from "@/lib/billing/quota";
import { DOCUMENT_TEMPLATES } from "@/lib/documents/templates";
import { generateDocumentSections } from "@/lib/documents/claude-client";

const VALID_TYPES = new Set<ComplianceDocumentType>(Object.keys(DOCUMENT_TEMPLATES) as ComplianceDocumentType[]);

interface RequestBody {
  assessmentId: string;
  types: ComplianceDocumentType[];
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.assessmentId === "string" &&
    b.assessmentId.length > 0 &&
    Array.isArray(b.types) &&
    b.types.length > 0 &&
    b.types.every((t) => typeof t === "string" && VALID_TYPES.has(t as ComplianceDocumentType)) &&
    new Set(b.types).size === b.types.length
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can generate documents" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid document request" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const assessmentSnap = await db.doc(firestorePaths.assessment(orgId, body.assessmentId)).get();
  if (!assessmentSnap.exists) {
    return NextResponse.json({ error: "Risk assessment not found" }, { status: 404 });
  }
  const assessment = assessmentSnap.data() as AssessmentDoc;

  if (assessment.prohibitedPracticeDetected) {
    return NextResponse.json(
      { error: "This system has a prohibited practice under the EU AI Act — documents cannot be generated until it's resolved." },
      { status: 403 }
    );
  }

  const systemSnap = await db.doc(firestorePaths.aiSystem(orgId, assessment.aiSystemId)).get();
  if (!systemSnap.exists) {
    return NextResponse.json({ error: "AI system not found" }, { status: 404 });
  }
  const system = systemSnap.data() as AiSystemDoc;

  const orgRef = db.doc(firestorePaths.organization(orgId));
  const orgSnap = await orgRef.get();
  const organization = orgSnap.data() as OrganizationDoc | undefined;
  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const quota = checkMonthlyQuota(organization, "documents", body.types.length);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.error }, { status: 403 });
  }
  const { monthIsStale, currentMonthKey } = quota;

  const generated = await Promise.all(
    body.types.map(async (type) => {
      const template = DOCUMENT_TEMPLATES[type];
      const sections = await generateDocumentSections({
        template,
        system,
        assessment,
        companyName: organization.companyName,
      });
      return { type, template, sections };
    })
  );

  const now = FieldValue.serverTimestamp();
  const today = new Date().toISOString().slice(0, 10);
  const batch = db.batch();
  const createdIds: string[] = [];

  for (const { type, template, sections } of generated) {
    const docRef = db.collection(firestorePaths.documents(orgId)).doc();
    createdIds.push(docRef.id);
    batch.set(docRef, {
      assessmentId: body.assessmentId,
      aiSystemId: assessment.aiSystemId,
      type,
      version: 1,
      isCurrent: true,
      status: "draft",
      fixedFields: {
        companyName: organization.companyName,
        systemName: system.name,
        assessmentDate: today,
        preparedBy: user.email,
        approvedAt: null,
      },
      sections: template.sections.map((s) => ({ id: s.id, title: s.title, content: sections[s.id] ?? "" })),
      createdAt: now,
      updatedAt: now,
      createdBy: user.uid,
    });

    const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
    batch.set(auditRef, {
      actorId: user.uid,
      action: "document_generated",
      targetCollection: "documents",
      targetId: docRef.id,
      timestamp: now,
      metadata: { type, systemName: system.name, version: 1 },
    });
  }

  batch.update(orgRef, {
    "usage.documentsGeneratedThisMonth": monthIsStale
      ? body.types.length
      : FieldValue.increment(body.types.length),
    "usage.usageMonthKey": currentMonthKey,
  });

  await batch.commit();

  return NextResponse.json({ ok: true, ids: createdIds });
}
