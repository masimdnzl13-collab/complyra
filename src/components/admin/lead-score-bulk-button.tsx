"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BulkResult {
  attempted: number;
  scored: number;
  blocked: number;
  failed: number;
  remainingCandidates?: number;
}

export function LeadScoreBulkButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/leads/score-bulk", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
      } else {
        setResult(data);
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy-900">Score unscanned leads</p>
          <p className="mt-0.5 text-xs text-navy-500">Scans websites for export, AI-usage, and maturity signals.</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50"
        >
          {busy ? "Scanning…" : "Score unscanned leads"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {result && (
        <p className="mt-2 text-xs text-navy-500">
          Attempted {result.attempted}, scored {result.scored}, blocked by robots.txt {result.blocked}, failed {result.failed}.
        </p>
      )}
    </div>
  );
}
