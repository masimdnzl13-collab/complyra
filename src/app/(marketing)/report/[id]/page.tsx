import Link from "next/link";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type LeadDoc } from "@/lib/firestore/schema";
import type { ScanResult } from "@/lib/risk-scan/types";
import { constructMetadata } from "@/lib/construct-metadata";
import { FindingCard } from "@/components/risk-scan/finding-card";

export const metadata = constructMetadata({
  title: "Your risk scan report",
  path: "/report",
  noIndex: true,
});

interface ReportPageProps {
  params: { id: string };
}

async function loadLead(id: string): Promise<LeadDoc | null> {
  const db = getAdminFirestore();
  const snap = await db.doc(firestorePaths.lead(id)).get();
  if (!snap.exists) return null;
  return snap.data() as LeadDoc;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const lead = await loadLead(params.id);

  if (!lead) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">Report not found</h1>
        <p className="mt-3 text-navy-600">
          This report link is invalid or has expired. You can run a new free scan below.
        </p>
        <Link
          href="/risk-scan"
          className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
        >
          Start a risk scan
        </Link>
      </div>
    );
  }

  const result = lead.result as unknown as ScanResult;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <p className="inline-block rounded-full bg-navy-50 px-4 py-1 text-sm font-medium text-navy-600">
          Your EU AI Act risk scan report
        </p>
        {result.earlyExit ? (
          <>
            <h1 className="mt-6 text-2xl font-semibold text-navy-900">Not covered — yet</h1>
            <p className="mt-4 text-navy-600">{result.earlyExitMessage}</p>
          </>
        ) : (
          <h1 className="mt-6 text-2xl font-semibold text-navy-900">
            {result.matchedAreas} of {result.totalAreas} EU AI Act areas apply to your company
          </h1>
        )}
      </div>

      {!result.earlyExit && (
        <div className="mt-10 space-y-4">
          {result.findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}

      <div className="mt-12 rounded-xl border border-navy-100 bg-navy-900 p-8 text-center text-white">
        <h2 className="text-lg font-semibold">Turn this into your compliance file</h2>
        <p className="mt-2 text-sm text-navy-200">
          Complyra generates the documentation each of these obligations requires, and keeps it
          current as your AI systems change.
        </p>
        <Link
          href="/register"
          className="mt-5 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
        >
          Get started with Complyra
        </Link>
      </div>
    </div>
  );
}
