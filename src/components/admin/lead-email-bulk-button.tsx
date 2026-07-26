"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface BulkResult {
  attempted: number;
  found: number;
  notFound: number;
  quotaStoppedEarly: boolean;
  remainingCandidates?: number;
}

export function LeadEmailBulkButton() {
  const router = useRouter();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/leads/hunter-status")
      .then((res) => res.json())
      .then((data) => setRemaining(data?.status?.available ?? null))
      .catch(() => setRemaining(null));
  }, []);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/leads/find-emails-bulk", { method: "POST" });
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
          <p className="text-sm font-medium text-navy-900">Fill missing emails</p>
          <p className="mt-0.5 text-xs text-navy-500">
            {remaining !== null ? `${remaining} Hunter.io searches remaining this month.` : "Hunter.io not configured or status unavailable."}
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50"
        >
          {busy ? "Searching…" : "Fill missing emails"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {result && (
        <p className="mt-2 text-xs text-navy-500">
          Attempted {result.attempted}, found {result.found}, not found {result.notFound}
          {result.quotaStoppedEarly ? " — stopped early, monthly quota reached." : "."}
        </p>
      )}
    </div>
  );
}
