import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type Article50Artifact } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import {
  ARTICLE_50_2_STATE_OF_THE_ART_NOTE,
  LANGUAGE_LABELS,
  MACHINE_MARKING_NOT_DETECTION_NOTE,
} from "@/lib/article50/content";
import {
  ChatbotDisclosureDataSchema,
  ContentLabelingDataSchema,
  DeepfakeDisclosureDataSchema,
  type ChatbotDisclosureData,
  type ContentLabelingData,
  type DeepfakeDisclosureData,
  type Language,
} from "@/lib/article50/types";
import { ApproveButton } from "@/components/article50/approve-button";

export const metadata = constructMetadata({ title: "Article 50 artifact", path: "/article-50", noIndex: true });

interface PageProps {
  params: { id: string };
}

export default async function Article50ArtifactPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const snap = await getAdminFirestore().doc(firestorePaths.article50Artifact(orgId, params.id)).get();
  if (!snap.exists) notFound();
  const artifact = snap.data() as Article50Artifact;
  const isOwner = user.userDoc.role === "owner";

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{artifact.title}</h1>
          <p className="mt-1 text-sm text-navy-600">Version {artifact.version}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            artifact.status === "reviewed" ? "bg-success/10 text-success" : "bg-navy-100 text-navy-500"
          }`}
        >
          {artifact.status === "reviewed" ? "Published" : "Draft"}
        </span>
      </div>

      {isOwner && (
        <div className="mt-6 flex flex-wrap gap-3">
          {artifact.status === "draft" && <ApproveButton artifactId={params.id} />}
          <a
            href={`/api/article50/${params.id}/pdf`}
            className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
          >
            Download PDF
          </a>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {artifact.area === "chatbot_disclosure" && (
          <ChatbotDisclosureView data={ChatbotDisclosureDataSchema.parse(artifact.data)} />
        )}
        {artifact.area === "content_labeling" && (
          <ContentLabelingView data={ContentLabelingDataSchema.parse(artifact.data)} />
        )}
        {artifact.area === "deepfake_disclosure" && (
          <DeepfakeView data={DeepfakeDisclosureDataSchema.parse(artifact.data)} />
        )}
      </div>
    </div>
  );
}

function ChatbotDisclosureView({ data }: { data: ChatbotDisclosureData }) {
  return (
    <>
      {data.languages.map((lang) => (
        <div key={lang} className="rounded-xl border border-navy-100 bg-surface p-6">
          <h2 className="text-sm font-semibold text-navy-900">{LANGUAGE_LABELS[lang as Language] ?? lang}</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{data.texts[lang as Language]}</p>
        </div>
      ))}
    </>
  );
}

const MATURITY_LABELS: Record<string, string> = {
  available: "Mature",
  limited: "Limited",
  still_maturing: "Still maturing",
};

const MATURITY_STYLES: Record<string, string> = {
  available: "bg-success/10 text-success",
  limited: "bg-warning/10 text-warning",
  still_maturing: "bg-warning/10 text-warning",
};

function ContentLabelingView({ data }: { data: ContentLabelingData }) {
  const hasMachineMarking = !!data.machineMarkingGuidance && data.machineMarkingGuidance.length > 0;

  return (
    <>
      <div className="rounded-xl border border-navy-100 bg-surface p-6">
        <h2 className="text-sm font-semibold text-navy-900">Human-perceptible label</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{data.labelText}</p>
      </div>

      {hasMachineMarking && (
        <div className="rounded-xl border border-navy-100 bg-surface p-6">
          <h2 className="text-sm font-semibold text-navy-900">Machine-readable marking</h2>
          <p className="mt-2 text-xs text-navy-500">
            The label above is the human-perceptible half of Article 50(2); machine-readable marking is the
            other half — both are required together, not as alternatives. This works alongside your{" "}
            <Link href="/article-50/watermark" className="font-medium text-accent hover:text-accent-600">
              watermark checklist
            </Link>{" "}
            for your generative model/vendor, not instead of it.
          </p>

          <div className="mt-4 divide-y divide-navy-100">
            {data.machineMarkingGuidance!.map((g) => (
              <div key={g.contentType} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold capitalize text-navy-900">{g.contentType}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${MATURITY_STYLES[g.maturity]}`}>
                    {MATURITY_LABELS[g.maturity]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-navy-500">{g.maturityNote}</p>
                <ul className="mt-2 space-y-1.5">
                  {g.methods.map((m) => (
                    <li key={m.method} className="text-sm text-navy-700">
                      <span className="font-medium text-navy-900">{m.method}:</span> {m.howTo}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-navy-500">{g.placementNote}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 border-t border-navy-100 pt-4 text-xs text-navy-500">{ARTICLE_50_2_STATE_OF_THE_ART_NOTE}</p>
          <p className="mt-2 text-xs text-navy-400">{MACHINE_MARKING_NOT_DETECTION_NOTE}</p>
        </div>
      )}

      <div className="rounded-xl border border-navy-100 bg-surface p-6">
        <h2 className="text-sm font-semibold text-navy-900">Implementation checklist</h2>
        <ul className="mt-3 space-y-2 text-sm text-navy-700">
          {data.checklist.map((item) => (
            <li key={item.id}>
              {item.checked ? "☑" : "☐"} {item.label}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function DeepfakeView({ data }: { data: DeepfakeDisclosureData }) {
  return (
    <>
      {data.deepfakeText && (
        <div className="rounded-xl border border-navy-100 bg-surface p-6">
          <h2 className="text-sm font-semibold text-navy-900">Deepfake disclosure</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{data.deepfakeText}</p>
        </div>
      )}
      {data.publicInterestText && (
        <div className="rounded-xl border border-navy-100 bg-surface p-6">
          <h2 className="text-sm font-semibold text-navy-900">Public-interest text disclosure</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{data.publicInterestText}</p>
        </div>
      )}
    </>
  );
}
