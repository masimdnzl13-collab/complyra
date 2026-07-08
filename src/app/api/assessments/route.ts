import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  firestorePaths,
  type AiSystemDoc,
  type AssessmentDoc,
  type DecisionPoint,
  type OrganizationDoc,
  type SystemDeploymentStage,
} from "@/lib/firestore/schema";
import { checkMonthlyQuota } from "@/lib/billing/quota";
import {
  checkDerogation,
  checkProhibitedPractice,
  getAnnexIIICategory,
  ANNEX_III_REFERENCES,
} from "@/lib/risk-assessment/rules";
import { evaluateWithClaude } from "@/lib/risk-assessment/claude-client";

const DECISION_POINTS = new Set<DecisionPoint>([
  "hiring_evaluation",
  "credit_insurance",
  "education_exam",
  "law_enforcement",
  "migration_border",
  "public_benefits",
  "judicial_decision",
  "none",
]);
const DEPLOYMENT_STAGES = new Set<SystemDeploymentStage>(["production", "testing", "planned"]);

interface RequestBody {
  systemId: string;
  decisionPoint: DecisionPoint;
  systemDeploymentStage: SystemDeploymentStage;
  systemLastModifiedAt: string;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.systemId === "string" &&
    b.systemId.length > 0 &&
    typeof b.decisionPoint === "string" &&
    DECISION_POINTS.has(b.decisionPoint as DecisionPoint) &&
    typeof b.systemDeploymentStage === "string" &&
    DEPLOYMENT_STAGES.has(b.systemDeploymentStage as SystemDeploymentStage) &&
    typeof b.systemLastModifiedAt === "string" &&
    b.systemLastModifiedAt.length > 0
  );
}

function isEdgeCase(confidence: "high" | "medium" | "low", justification: string, caveats: string): boolean {
  if (confidence === "low") return true;
  return /\b(borderline|depends on)\b/i.test(`${justification} ${caveats}`);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (user.userDoc.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can run risk assessments" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid assessment request" }, { status: 400 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const systemRef = db.doc(firestorePaths.aiSystem(orgId, body.systemId));
  const systemSnap = await systemRef.get();
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

  const quota = checkMonthlyQuota(organization, "assessments");
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.error }, { status: 403 });
  }
  const { monthIsStale, currentMonthKey } = quota;

  // Archive any existing active assessment for this system before writing
  // the new one — reassessing never overwrites or deletes history.
  const existingAssessments = await db
    .collection(firestorePaths.assessments(orgId))
    .where("aiSystemId", "==", body.systemId)
    .get();
  const priorActive = existingAssessments.docs.find((d) => (d.data() as AssessmentDoc).status === "active");
  const nextVersion =
    existingAssessments.docs.reduce((max, d) => Math.max(max, (d.data() as AssessmentDoc).version), 0) + 1;

  const now = FieldValue.serverTimestamp();
  const assessmentRef = db.collection(firestorePaths.assessments(orgId)).doc();
  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();

  let assessmentData: Omit<AssessmentDoc, "createdAt" | "createdBy">;

  const prohibited = checkProhibitedPractice(system);
  if (prohibited.detected) {
    assessmentData = {
      aiSystemId: body.systemId,
      version: nextVersion,
      status: "active",
      decisionPoint: body.decisionPoint,
      systemDeploymentStage: body.systemDeploymentStage,
      systemLastModifiedAt: body.systemLastModifiedAt,
      prohibitedPracticeDetected: true,
      prohibitedPracticeReference: prohibited.reference,
      derogationApplies: false,
      annexIIICategory: null,
      riskTier: "unacceptable",
      legalArticleReference: prohibited.reference ?? "Article 5",
      justification:
        "This system infers the emotions or behavior of employees, which is a prohibited practice under " +
        `${prohibited.reference} of the EU AI Act. This is not a documentation gap — it is a ban. Stop this ` +
        "use case immediately and seek legal advice before continuing.",
      confidenceLevel: "high",
      isEdgeCase: false,
    };
  } else {
    const derogationApplies = checkDerogation(body.decisionPoint, system);
    const annexIIICategory = getAnnexIIICategory(body.decisionPoint);

    if (derogationApplies && annexIIICategory) {
      const transparencyTriggered = system.interactsWithPeople || system.generatesSyntheticContent;
      assessmentData = {
        aiSystemId: body.systemId,
        version: nextVersion,
        status: "active",
        decisionPoint: body.decisionPoint,
        systemDeploymentStage: body.systemDeploymentStage,
        systemLastModifiedAt: body.systemLastModifiedAt,
        prohibitedPracticeDetected: false,
        prohibitedPracticeReference: null,
        derogationApplies: true,
        annexIIICategory,
        riskTier: transparencyTriggered ? "limited" : "minimal",
        legalArticleReference: `Article 6(3) derogation (${ANNEX_III_REFERENCES[annexIIICategory]})`,
        justification:
          `This system's decision point falls under ${ANNEX_III_REFERENCES[annexIIICategory]}, which is ` +
          "ordinarily high-risk. However, the system only provides information or recommendations and a " +
          "person makes the actual decision, so it qualifies for the Article 6(3) derogation and is not " +
          "classified as high-risk. Keep this record on file as your documented exemption.",
        confidenceLevel: "medium",
        isEdgeCase: false,
      };
    } else {
      const claudeResult = await evaluateWithClaude({
        system,
        decisionPoint: body.decisionPoint,
        annexIIICategory,
        systemDeploymentStage: body.systemDeploymentStage,
      });

      const riskTierMap = { "high-risk": "high", "limited-risk": "limited", "minimal-risk": "minimal" } as const;

      assessmentData = {
        aiSystemId: body.systemId,
        version: nextVersion,
        status: "active",
        decisionPoint: body.decisionPoint,
        systemDeploymentStage: body.systemDeploymentStage,
        systemLastModifiedAt: body.systemLastModifiedAt,
        prohibitedPracticeDetected: false,
        prohibitedPracticeReference: null,
        derogationApplies: false,
        annexIIICategory,
        riskTier: riskTierMap[claudeResult.riskTier],
        legalArticleReference: claudeResult.articles.join(", ") || "See justification",
        justification: claudeResult.caveats
          ? `${claudeResult.justification}\n\nCaveats: ${claudeResult.caveats}`
          : claudeResult.justification,
        confidenceLevel: claudeResult.confidence,
        isEdgeCase: isEdgeCase(claudeResult.confidence, claudeResult.justification, claudeResult.caveats),
      };
    }
  }

  const batch = db.batch();
  if (priorActive) {
    batch.update(priorActive.ref, { status: "archived" });
  }
  batch.set(assessmentRef, {
    ...assessmentData,
    createdAt: now,
    createdBy: user.uid,
  });
  batch.update(systemRef, { assessmentStatus: "assessed" });
  batch.update(orgRef, {
    "usage.assessmentsThisMonth": monthIsStale ? 1 : FieldValue.increment(1),
    "usage.usageMonthKey": currentMonthKey,
  });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "classification_changed",
    targetCollection: "assessments",
    targetId: assessmentRef.id,
    timestamp: now,
    metadata: { systemName: system.name, riskTier: assessmentData.riskTier },
  });

  await batch.commit();

  return NextResponse.json({ ok: true, id: assessmentRef.id, riskTier: assessmentData.riskTier });
}
