import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type Article50Artifact } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { LANGUAGE_LABELS } from "@/lib/article50/content";
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

function ContentLabelingView({ data }: { data: ContentLabelingData }) {
  return (
    <>
      <div className="rounded-xl border border-navy-100 bg-surface p-6">
        <h2 className="text-sm font-semibold text-navy-900">Label text</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-navy-700">{data.labelText}</p>
      </div>
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
