"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedLead } from "@/lib/leads/types";

function ApproveRejectButtons({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "reject") {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/${action}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        setError(data?.error ?? "Something went wrong.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => run("approve")}
          disabled={busy !== null}
          className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => run("reject")}
          disabled={busy !== null}
          className="rounded-md border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50 disabled:opacity-50"
        >
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function PendingLeadsTable({ leads }: { leads: SerializedLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-navy-100 bg-surface p-8 text-center text-sm text-navy-500">
        No candidates are awaiting review right now.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-navy-100 bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
          <tr>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">City / Sector</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Note</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-navy-50 last:border-0 align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-navy-900">{lead.companyName}</p>
                {lead.websiteUrl && (
                  <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:text-accent-600">
                    {lead.websiteUrl}
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-navy-600">
                {lead.city} · {lead.sector}
              </td>
              <td className="px-4 py-3">
                <p className="text-xs text-navy-500">{lead.discoverySource}</p>
                {lead.discoverySourceUrl && (
                  <a
                    href={lead.discoverySourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block max-w-xs truncate text-xs text-navy-500 hover:text-accent"
                  >
                    {lead.discoverySourceUrl}
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-navy-500">{lead.notes || "—"}</td>
              <td className="px-4 py-3">
                <ApproveRejectButtons leadId={lead.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
