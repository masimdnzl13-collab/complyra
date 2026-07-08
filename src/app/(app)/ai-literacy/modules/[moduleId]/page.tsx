import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type TrainingRecordDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { getModuleById, getModulesForRole, isModuleRequiredForRole } from "@/lib/ai-literacy/modules";
import { ModuleQuiz } from "@/components/ai-literacy/module-quiz";

interface PageProps {
  params: { moduleId: string };
}

export async function generateMetadata({ params }: PageProps) {
  const trainingModule = getModuleById(params.moduleId);
  return constructMetadata({ title: trainingModule?.title ?? "Training module", path: "/ai-literacy", noIndex: true });
}

export default async function ModulePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const trainingModule = getModuleById(params.moduleId);
  if (!trainingModule) notFound();

  const orgId = user.userDoc.organizationId;
  const recordSnap = await getAdminFirestore().doc(firestorePaths.trainingRecord(orgId, user.uid)).get();
  if (!recordSnap.exists) redirect("/ai-literacy/role");
  const record = recordSnap.data() as TrainingRecordDoc;

  if (!isModuleRequiredForRole(params.moduleId, record.role)) {
    redirect("/ai-literacy");
  }

  const requiredModules = getModulesForRole(record.role);
  const currentIndex = requiredModules.findIndex((m) => m.id === params.moduleId);
  const nextModule = requiredModules[currentIndex + 1] ?? null;
  const progress = record.moduleProgress[params.moduleId];

  return (
    <ModuleQuiz
      module={trainingModule}
      nextModuleId={nextModule?.id ?? null}
      initialAttempts={progress?.attempts ?? 0}
      initialBlocked={progress?.blockedForExpertReview ?? false}
      initialPassed={progress?.passed ?? false}
    />
  );
}
