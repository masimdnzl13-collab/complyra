import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firestorePaths, type TrainingRecordDoc } from "@/lib/firestore/schema";
import { getModuleById, getModulesForRole, MAX_ATTEMPTS } from "@/lib/ai-literacy/modules";
import { gradeQuiz } from "@/lib/ai-literacy/grade-quiz";

interface RequestBody {
  moduleId: string;
  answers: Record<string, string>;
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.moduleId === "string" &&
    b.moduleId.length > 0 &&
    !!b.answers &&
    typeof b.answers === "object" &&
    Object.values(b.answers as Record<string, unknown>).every((v) => typeof v === "string")
  );
}

/**
 * Grades entirely server-side against the module config — the client never
 * sees which option is correct until after submitting, so there's no way
 * to pass by inspecting the page source.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.userDoc) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const trainingModule = getModuleById(body.moduleId);
  if (!trainingModule) {
    return NextResponse.json({ error: "Unknown module" }, { status: 404 });
  }

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();
  const recordRef = db.doc(firestorePaths.trainingRecord(orgId, user.uid));
  const recordSnap = await recordRef.get();
  if (!recordSnap.exists) {
    return NextResponse.json({ error: "Enroll in training before taking a quiz" }, { status: 403 });
  }
  const record = recordSnap.data() as TrainingRecordDoc;

  const existingProgress = record.moduleProgress[body.moduleId];
  if (existingProgress?.blockedForExpertReview) {
    return NextResponse.json(
      { error: "You've used all 3 attempts for this module — expert review is required. Contact your compliance lead." },
      { status: 403 }
    );
  }

  const { score, passed, results } = gradeQuiz(trainingModule, body.answers);
  const attempts = (existingProgress?.attempts ?? 0) + 1;
  const blockedForExpertReview = !passed && attempts >= MAX_ATTEMPTS;

  const now = FieldValue.serverTimestamp();
  const updatedProgress = {
    ...record.moduleProgress,
    [body.moduleId]: {
      attempts,
      bestScore: Math.max(existingProgress?.bestScore ?? 0, score),
      passed: passed || !!existingProgress?.passed,
      passedAt: passed ? now : existingProgress?.passedAt ?? null,
      blockedForExpertReview,
    },
  };

  const requiredModules = getModulesForRole(record.role);
  const allPassed = requiredModules.every((m) => updatedProgress[m.id]?.passed);
  const alreadyCompleted = !!record.completedAt;
  const certificateId = alreadyCompleted ? record.certificateId : allPassed ? randomBytes(12).toString("hex") : null;

  const auditRef = db.collection(firestorePaths.auditLog(orgId)).doc();
  const batch = db.batch();
  batch.update(recordRef, {
    moduleProgress: updatedProgress,
    completedAt: allPassed ? (alreadyCompleted ? record.completedAt : now) : null,
    certificateId,
    updatedAt: now,
  });
  batch.set(auditRef, {
    actorId: user.uid,
    action: "record_updated",
    targetCollection: "trainingRecords",
    targetId: user.uid,
    timestamp: now,
    metadata: { userName: record.userName, moduleId: body.moduleId, result: passed ? "pass" : "fail", score },
  });
  await batch.commit();

  return NextResponse.json({
    ok: true,
    score,
    passed,
    attempts,
    blockedForExpertReview,
    results,
    trainingCompleted: allPassed,
  });
}
