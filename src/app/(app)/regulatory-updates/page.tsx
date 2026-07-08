import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type RegulatoryUpdateCategory, type RegulatoryUpdateDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";

export const metadata = constructMetadata({
  title: "Regulatory Updates",
  path: "/regulatory-updates",
  noIndex: true,
});

const CATEGORY_LABELS: Record<RegulatoryUpdateCategory, string> = {
  transparency: "Transparency",
  high_risk: "High-risk",
  prohibited: "Prohibited practices",
  general: "General",
};

interface PageProps {
  searchParams: { category?: string };
}

export default async function RegulatoryUpdatesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const db = getAdminFirestore();
  const snap = await db.collection(firestorePaths.regulatoryUpdates()).orderBy("createdAt", "desc").limit(50).get();
  const allUpdates = snap.docs.map((d) => d.data() as RegulatoryUpdateDoc);

  const activeCategory = searchParams.category as RegulatoryUpdateCategory | undefined;
  const updates = activeCategory ? allUpdates.filter((u) => u.category === activeCategory) : allUpdates;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Regulatory Updates</h1>
      <p className="mt-1 text-navy-600">EU AI Act developments, summarized.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href="/regulatory-updates"
          className={`rounded-full px-3 py-1 text-xs font-medium ${!activeCategory ? "bg-accent text-white" : "bg-navy-100 text-navy-600"}`}
        >
          All
        </a>
        {(Object.keys(CATEGORY_LABELS) as RegulatoryUpdateCategory[]).map((cat) => (
          <a
            key={cat}
            href={`/regulatory-updates?category=${cat}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${activeCategory === cat ? "bg-accent text-white" : "bg-navy-100 text-navy-600"}`}
          >
            {CATEGORY_LABELS[cat]}
          </a>
        ))}
      </div>

      {updates.length === 0 ? (
        <p className="mt-8 text-sm text-navy-500">No updates in this category yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {updates.map((update, i) => (
            <li key={i} className="rounded-xl border border-navy-100 bg-surface p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy-500">
                  {CATEGORY_LABELS[update.category]}
                </span>
                <span className="text-xs text-navy-400">{update.publishedAt.toDate().toLocaleDateString()}</span>
              </div>
              <a
                href={update.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-sm font-semibold text-navy-900 hover:text-accent"
              >
                {update.title}
              </a>
              <p className="mt-1 text-sm text-navy-600">{update.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
