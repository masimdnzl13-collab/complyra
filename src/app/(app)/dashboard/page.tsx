import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  firestorePaths,
  type AiSystemDoc,
  type Article50Artifact,
  type AssessmentDoc,
  type AuditLogEntryDoc,
  type ComplianceDocumentDoc,
  type OrganizationDoc,
  type TrainingRecordDoc,
} from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans, regulationDeadlines } from "@/config/site";
import { InviteTeammateForm } from "@/components/team/invite-teammate-form";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import { DualTimeline } from "@/components/dashboard/dual-timeline";
import { calculateComplianceScore, getScoreOpportunities } from "@/lib/dashboard/score";
import { buildComplianceChecklist, type ChecklistSeverity } from "@/lib/dashboard/checklist";

export const metadata = constructMetadata({
  title: "Dashboard",
  path: "/dashboard",
  noIndex: true,
});

const ARTICLE_50_AREA_LABELS: Record<Article50Artifact["area"], string> = {
  chatbot_disclosure: "Chatbot disclosure",
  content_labeling: "Content labeling",
  watermark_checklist: "Watermark checklist",
  deepfake_disclosure: "Deepfake disclosure",
};

const SEVERITY_STYLES: Record<ChecklistSeverity, string> = {
  urgent: "border-danger bg-danger/5",
  warning: "border-warning bg-warning/5",
  info: "border-navy-100 bg-navy-50",
};

const SEVERITY_LABELS: Record<ChecklistSeverity, string> = {
  urgent: "Urgent",
  warning: "Action needed",
  info: "To do",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const [orgSnap, systemsSnap, assessmentsSnap, documentsSnap, article50Snap, trainingSnap, usersSnap, auditSnap] =
    await Promise.all([
      db.doc(firestorePaths.organization(orgId)).get(),
      db.collection(firestorePaths.aiSystems(orgId)).get(),
      db.collection(firestorePaths.assessments(orgId)).where("status", "==", "active").get(),
      db.collection(firestorePaths.documents(orgId)).where("isCurrent", "==", true).get(),
      db.collection(firestorePaths.article50Artifacts(orgId)).where("isCurrent", "==", true).get(),
      db.collection(firestorePaths.trainingRecords(orgId)).get(),
      db.collection(firestorePaths.users()).where("organizationId", "==", orgId).get(),
      db.collection(firestorePaths.auditLog(orgId)).orderBy("timestamp", "desc").limit(8).get(),
    ]);

  const organization = orgSnap.data() as OrganizationDoc | undefined;
  const systems = systemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AiSystemDoc) }));
  const assessments = assessmentsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AssessmentDoc) }));
  const documents = documentsSnap.docs.map((d) => d.data() as ComplianceDocumentDoc);
  const article50Docs = article50Snap.docs.map((d) => d.data() as Article50Artifact);
  const trainingRecords = trainingSnap.docs.map((d) => d.data() as TrainingRecordDoc);
  const auditEntries = auditSnap.docs.map((d) => d.data() as AuditLogEntryDoc);
  const totalTeamMembers = usersSnap.size;

  // --- AI systems ---
  const activeSystems = systems.filter((s) => s.status !== "retired");
  const assessedSystems = activeSystems.filter((s) => s.assessmentStatus === "assessed");
  const unassessedSystemsCount = activeSystems.length - assessedSystems.length;

  // --- Assessments / documents ---
  const documentableAssessments = assessments.filter((a) => a.riskTier !== "unacceptable");
  const documentedAssessmentIds = new Set(documents.map((d) => d.assessmentId));
  const documentedAssessments = documentableAssessments.filter((a) => documentedAssessmentIds.has(a.id));
  const undocumentedAssessmentsCount = documentableAssessments.length - documentedAssessments.length;

  const prohibitedSystems = assessments
    .filter((a) => a.riskTier === "unacceptable")
    .map((a) => {
      const system = activeSystems.find((s) => s.id === a.aiSystemId);
      return { id: a.aiSystemId, name: system?.name ?? "Unknown system" };
    });
  const borderlineAssessments = assessments
    .filter((a) => a.isEdgeCase)
    .map((a) => {
      const system = activeSystems.find((s) => s.id === a.aiSystemId);
      return { id: a.id, systemId: a.aiSystemId, systemName: system?.name ?? "Unknown system" };
    });

  // --- Article 50 readiness (same logic as the /article-50 dashboard) ---
  const chatbotCandidateSystems = activeSystems.filter((s) => s.interactsWithPeople);
  const chatbotArtifactSystemIds = new Set(
    article50Docs.filter((a) => a.area === "chatbot_disclosure").map((a) => a.aiSystemId)
  );
  const chatbotReady = chatbotCandidateSystems.length === 0 || chatbotCandidateSystems.every((s) => chatbotArtifactSystemIds.has(s.id));
  const labelingReady = article50Docs.some((a) => a.area === "content_labeling");
  const watermarkArtifact = article50Docs.find((a) => a.area === "watermark_checklist");
  const watermarkData = watermarkArtifact?.data as
    | { watermarkCapability: string; vendorCommitmentDocumented: boolean; standardSelected: boolean; outputFilesVerified: boolean }
    | undefined;
  const watermarkReady =
    !!watermarkData &&
    watermarkData.watermarkCapability !== "no" &&
    watermarkData.vendorCommitmentDocumented &&
    watermarkData.standardSelected &&
    watermarkData.outputFilesVerified;
  const deepfakeReady = article50Docs.some((a) => a.area === "deepfake_disclosure");

  const article50AreaReadiness: { label: string; ready: boolean }[] = [
    { label: ARTICLE_50_AREA_LABELS.chatbot_disclosure, ready: chatbotReady },
    { label: ARTICLE_50_AREA_LABELS.content_labeling, ready: labelingReady },
    { label: ARTICLE_50_AREA_LABELS.watermark_checklist, ready: watermarkReady },
    { label: ARTICLE_50_AREA_LABELS.deepfake_disclosure, ready: deepfakeReady },
  ];
  const article50ReadyAreas = article50AreaReadiness.filter((a) => a.ready).length;
  const article50MissingAreas = article50AreaReadiness.filter((a) => !a.ready);

  // --- Training ---
  const completedTraining = trainingRecords.filter((r) => r.completedAt).length;
  const incompleteTrainingCount = Math.max(totalTeamMembers - completedTraining, 0);

  // --- Score ---
  const scoreInputs = {
    totalSystems: activeSystems.length,
    assessedSystems: assessedSystems.length,
    documentableAssessments: documentableAssessments.length,
    documentedAssessments: documentedAssessments.length,
    totalTeamMembers,
    completedTraining,
    article50ReadyAreas,
    article50TotalAreas: article50AreaReadiness.length,
  };
  const { score } = calculateComplianceScore(scoreInputs);
  const opportunities = getScoreOpportunities(scoreInputs).slice(0, 3);

  const checklist = buildComplianceChecklist({
    unassessedSystemsCount,
    prohibitedSystems,
    borderlineAssessments,
    undocumentedAssessmentsCount,
    article50MissingAreas,
    incompleteTrainingCount,
  });

  const transparencyDeadline = regulationDeadlines.find((d) => d.id === "transparency")!;
  const watermarkingDeadline = regulationDeadlines.find((d) => d.id === "watermarking")!;
  const highRiskDeadline = regulationDeadlines.find((d) => d.id === "high-risk")!;

  const plan = pricingPlans.find((p) => p.id === organization?.subscription.planId);
  const systemsNearLimit =
    plan && plan.systemsLimit !== "unlimited" && activeSystems.length >= plan.systemsLimit;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-900">
            {organization ? organization.companyName : "Dashboard"}
          </h1>
          <p className="mt-1 text-navy-600">Your EU AI Act compliance overview.</p>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-navy-500 hover:text-navy-900">
          Settings
        </Link>
      </div>

      {/* Compliance score */}
      <div className="mt-8 flex flex-col items-center gap-6 rounded-xl border border-navy-100 bg-surface p-8 sm:flex-row sm:items-start">
        <ScoreGauge score={score} />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-navy-900">Compliance Score</h2>
          {opportunities.length === 0 ? (
            <p className="mt-2 text-sm text-success">Nothing outstanding — every measured area is in good shape.</p>
          ) : (
            <p className="mt-2 text-sm text-navy-600">
              To reach {Math.min(100, score + opportunities.reduce((s, o) => s + o.pointsGain, 0))}+:{" "}
              {opportunities.map((o, i) => (
                <span key={o.href + i}>
                  <Link href={o.href} className="font-medium text-accent hover:text-accent-600">
                    {o.description}
                  </Link>
                  {` (+${o.pointsGain})`}
                  {i < opportunities.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {/* Dual timeline */}
      <div className="mt-8">
        <DualTimeline
          transparencyDate={transparencyDeadline.date}
          watermarkingDate={watermarkingDeadline.date}
          highRiskDate={highRiskDeadline.date}
          annexIIINote="Applies if you have systems in Annex III high-risk categories — see Risk Assessments for your organization's classifications."
        />
      </div>

      {/* Checklist */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Your next steps</h2>
        {checklist.length === 0 ? (
          <p className="mt-3 text-sm text-success">You&apos;re all caught up.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {checklist.map((item, i) => (
              <div key={i} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 p-4 ${SEVERITY_STYLES[item.severity]}`}>
                <div>
                  <span
                    className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      item.severity === "urgent" ? "bg-danger text-white" : "bg-navy-900/5 text-navy-600"
                    }`}
                  >
                    {SEVERITY_LABELS[item.severity]}
                  </span>
                  <p className="text-sm font-semibold text-navy-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-navy-600">{item.description}</p>
                </div>
                <Link
                  href={item.href}
                  className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
                >
                  {item.actionLabel}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Quick actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard title="Add new AI system" color="bg-accent" href="/ai-systems/new" count={activeSystems.length} countLabel="registered" />
          <QuickActionCard title="Assess system risk" color="bg-warning" href="/assessments" count={unassessedSystemsCount} countLabel="pending" />
          <QuickActionCard title="Generate documents" color="bg-navy-700" href="/documents/new" count={undocumentedAssessmentsCount} countLabel="pending" />
          <QuickActionCard title="Schedule AI Literacy training" color="bg-success" href="/ai-literacy/reports" count={incompleteTrainingCount} countLabel="pending" />
        </div>
      </div>

      {/* At a glance */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">At a glance</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <GlanceCard label="AI Systems Registered" value={String(activeSystems.length)} />
          <GlanceCard
            label="Systems Assessed"
            value={`${assessedSystems.length} / ${activeSystems.length}`}
            progress={activeSystems.length === 0 ? 0 : assessedSystems.length / activeSystems.length}
          />
          <GlanceCard label="Documents Generated" value={String(documents.length)} />
          <GlanceCard
            label="Team Members"
            value={String(totalTeamMembers)}
            sub={`${completedTraining} completed / ${incompleteTrainingCount} pending`}
          />
          <div className="rounded-xl border border-navy-100 bg-surface p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-navy-500">Current Plan</p>
              {systemsNearLimit && (
                <Link href="/pricing" className="text-xs font-medium text-accent hover:text-accent-600">
                  Upgrade available
                </Link>
              )}
            </div>
            <p className="mt-1 text-lg font-semibold text-navy-900">{plan?.name ?? "—"}</p>
            {plan && (
              <p className="mt-1 text-xs text-navy-500">
                {activeSystems.length}/{plan.systemsLimit === "unlimited" ? "∞" : plan.systemsLimit} systems quota used
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Regulatory updates placeholder */}
      <div className="mt-8 rounded-xl border border-dashed border-navy-200 bg-navy-50 p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-navy-900">Regulatory News</h2>
          <Link href="/blog" className="text-xs font-medium text-accent hover:text-accent-600">
            See all updates
          </Link>
        </div>
        <p className="mt-2 text-sm text-navy-600">
          Digital Omnibus approved June 2026 — high-risk obligations timeline moved to 2 December 2027.
        </p>
      </div>

      {/* Recent activity + team */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Recent activity</h2>
          {auditEntries.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">Nothing logged yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {auditEntries.map((entry, i) => (
                <li key={i} className="rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm text-navy-700">
                  {entry.action.replace(/_/g, " ")}
                  <span className="ml-2 text-xs text-navy-400">{entry.timestamp.toDate().toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {user.userDoc.role === "owner" && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Team</h2>
            <div className="mt-3">
              <InviteTeammateForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  color,
  href,
  count,
  countLabel,
}: {
  title: string;
  color: string;
  href: string;
  count: number;
  countLabel: string;
}) {
  return (
    <Link href={href} className={`relative block rounded-xl p-5 text-white transition-opacity hover:opacity-90 ${color}`}>
      {count > 0 && (
        <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
          {count} {countLabel}
        </span>
      )}
      <p className="mt-6 text-sm font-semibold">{title}</p>
    </Link>
  );
}

function GlanceCard({ label, value, sub, progress }: { label: string; value: string; sub?: string; progress?: number }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-5">
      <p className="text-xs font-medium text-navy-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-navy-900">{value}</p>
      {typeof progress === "number" && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      {sub && <p className="mt-2 text-xs text-navy-500">{sub}</p>}
    </div>
  );
}
