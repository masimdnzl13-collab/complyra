import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type AiSystemDoc, type Article50Artifact } from "@/lib/firestore/schema";
import type { WatermarkChecklistData } from "@/lib/article50/types";
import { constructMetadata } from "@/lib/construct-metadata";
import { regulationDeadlines } from "@/config/site";
import { DeadlineCountdown } from "@/components/article50/deadline-countdown";

export const metadata = constructMetadata({
  title: "Article 50 Compliance",
  path: "/article-50",
  noIndex: true,
});

export default async function Article50Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const db = getAdminFirestore();

  const [systemsSnap, artifactsSnap] = await Promise.all([
    db.collection(firestorePaths.aiSystems(orgId)).where("interactsWithPeople", "==", true).get(),
    db.collection(firestorePaths.article50Artifacts(orgId)).where("isCurrent", "==", true).get(),
  ]);

  const chatbotSystems = systemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as AiSystemDoc) }));
  const artifacts = artifactsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Article50Artifact) }));

  const chatbotArtifactSystemIds = new Set(
    artifacts.filter((a) => a.area === "chatbot_disclosure").map((a) => a.aiSystemId)
  );
  const chatbotReady =
    chatbotSystems.length === 0 || chatbotSystems.every((s) => chatbotArtifactSystemIds.has(s.id));

  const labelingArtifact = artifacts.find((a) => a.area === "content_labeling");
  const watermarkArtifact = artifacts.find((a) => a.area === "watermark_checklist");
  const watermarkData = watermarkArtifact?.data as unknown as WatermarkChecklistData | undefined;
  const watermarkReady =
    !!watermarkData &&
    watermarkData.watermarkCapability !== "no" &&
    watermarkData.vendorCommitmentDocumented &&
    watermarkData.standardSelected &&
    watermarkData.outputFilesVerified;
  const deepfakeArtifact = artifacts.find((a) => a.area === "deepfake_disclosure");

  const transparencyDeadline = regulationDeadlines.find((d) => d.id === "transparency")!;
  const watermarkingDeadline = regulationDeadlines.find((d) => d.id === "watermarking")!;

  const cards = [
    {
      title: "Chatbot / direct-interaction notice",
      article: "Article 50(1)",
      deadline: transparencyDeadline.date,
      ready: chatbotReady,
      subtitle:
        chatbotSystems.length === 0
          ? "No AI systems currently talk directly with people"
          : `${chatbotSystems.filter((s) => chatbotArtifactSystemIds.has(s.id)).length} of ${chatbotSystems.length} systems covered`,
      href: "/article-50/chatbot",
    },
    {
      title: "AI-generated content labeling",
      article: "Article 50(2)",
      deadline: transparencyDeadline.date,
      ready: !!labelingArtifact,
      subtitle: labelingArtifact ? "Labeling template ready" : "No labeling template yet",
      href: labelingArtifact ? `/article-50/artifacts/${labelingArtifact.id}` : "/article-50/content-labeling/new",
    },
    {
      title: "Machine-readable watermark checklist",
      article: "Article 50(2)",
      deadline: watermarkingDeadline.date,
      ready: watermarkReady,
      subtitle: watermarkArtifact ? "Checklist started" : "Not started",
      href: "/article-50/watermark",
    },
    {
      title: "Deepfake & public-interest disclosure",
      article: "Article 50(4)",
      deadline: transparencyDeadline.date,
      ready: !!deepfakeArtifact,
      subtitle: deepfakeArtifact ? "Disclosure template ready" : "No disclosure template yet",
      href: deepfakeArtifact ? `/article-50/artifacts/${deepfakeArtifact.id}` : "/article-50/deepfake/new",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Article 50 Readiness</h1>
      <p className="mt-2 text-navy-600">
        Article 50 covers four practical obligations: telling people they&apos;re talking to AI, labeling
        AI-generated content, watermarking AI-generated media, and disclosing deepfakes and AI-generated
        public-interest text.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="block rounded-xl border border-navy-100 bg-surface p-5 transition-colors hover:border-navy-200"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-navy-900">{card.title}</h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  card.ready ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}
              >
                {card.ready ? "Ready" : "Missing"}
              </span>
            </div>
            <p className="mt-1 text-xs text-navy-500">{card.article}</p>
            <p className="mt-3 text-sm text-navy-600">{card.subtitle}</p>
            <div className="mt-3">
              <DeadlineCountdown targetDate={card.deadline} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
