"use client";

import { useMemo, useState } from "react";
import type { DiscoveredLeadStatus } from "@/lib/firestore/schema";
import { filterLeads, sortLeads, type LeadFilters, type LeadSortDirection, type LeadSortField } from "@/lib/leads/filter";
import { leadScoreBand, type LeadScoreBand } from "@/lib/leads/constants";
import type { SerializedLead } from "@/lib/leads/types";

const STATUS_LABELS: Record<DiscoveredLeadStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  contacted: "Contacted",
  not_converted: "Not converted",
  customer: "Customer",
};

const STATUS_STYLES: Record<DiscoveredLeadStatus, string> = {
  new: "bg-accent/10 text-accent",
  reviewed: "bg-navy-100 text-navy-600",
  contacted: "bg-warning/10 text-warning",
  not_converted: "bg-navy-100 text-navy-400",
  customer: "bg-success/10 text-success",
};

const SCORE_BAND_STYLES: Record<LeadScoreBand, string> = {
  high: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  low: "bg-navy-100 text-navy-500",
  unscored: "bg-navy-100 text-navy-400",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  verified: "Verified",
  pattern_guess: "Pattern guess",
  generic_corporate: "Generic corporate",
};

function ScoreBadge({ score }: { score: number | null }) {
  const band = leadScoreBand(score);
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SCORE_BAND_STYLES[band]}`}>
      {score !== null ? score : "Not scored"}
    </span>
  );
}

export function LeadsTable({ leads }: { leads: SerializedLead[] }) {
  const [filters, setFilters] = useState<LeadFilters>({});
  const [sortField, setSortField] = useState<LeadSortField>("discoveredAt");
  const [sortDirection, setSortDirection] = useState<LeadSortDirection>("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cities = useMemo(() => Array.from(new Set(leads.map((l) => l.city).filter(Boolean))).sort(), [leads]);
  const sectors = useMemo(() => Array.from(new Set(leads.map((l) => l.sector).filter(Boolean))).sort(), [leads]);

  const visibleLeads = useMemo(
    () => sortLeads(filterLeads(leads, filters), sortField, sortDirection),
    [leads, filters, sortField, sortDirection]
  );

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  function toggleSort(field: LeadSortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function exportUrl() {
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.sector) params.set("sector", filters.sector);
    if (filters.status) params.set("status", filters.status);
    if (filters.scoreBand) params.set("scoreBand", filters.scoreBand);
    params.set("sortField", sortField);
    params.set("sortDirection", sortDirection);
    return `/api/admin/leads/export?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-navy-500">City</span>
            <select
              value={filters.city ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value || undefined }))}
              className="rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-navy-500">Sector</span>
            <select
              value={filters.sector ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value || undefined }))}
              className="rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
            >
              <option value="">All sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-navy-500">Score</span>
            <select
              value={filters.scoreBand ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, scoreBand: (e.target.value as LeadScoreBand) || undefined }))}
              className="rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
            >
              <option value="">All scores</option>
              <option value="high">High (70+)</option>
              <option value="medium">Medium (40-69)</option>
              <option value="low">Low (&lt;40)</option>
              <option value="unscored">Not scored</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-navy-500">Status</span>
            <select
              value={filters.status ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as DiscoveredLeadStatus) || undefined }))}
              className="rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {(filters.city || filters.sector || filters.status || filters.scoreBand) && (
            <button
              type="button"
              onClick={() => setFilters({})}
              className="text-xs font-medium text-navy-500 hover:text-navy-900"
            >
              Clear filters
            </button>
          )}
        </div>
        <a
          href={exportUrl()}
          className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
        >
          Export to Excel
        </a>
      </div>

      <p className="mt-3 text-xs text-navy-500">
        {visibleLeads.length} of {leads.length} leads shown.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
            <tr>
              <SortableHeader field="companyName" label="Company" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableHeader field="city" label="City" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableHeader field="sector" label="Sector" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <th className="px-4 py-3">Emails</th>
              <SortableHeader field="aiUsageScore" label="AI score" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <th className="px-4 py-3">Source</th>
              <SortableHeader field="discoveredAt" label="Discovered" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableHeader field="status" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {visibleLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-navy-500">
                  No leads match these filters.
                </td>
              </tr>
            ) : (
              visibleLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedId(lead.id)}
                  className="cursor-pointer border-b border-navy-50 last:border-0 hover:bg-navy-50"
                >
                  <td className="px-4 py-3 font-medium text-navy-900">{lead.companyName}</td>
                  <td className="px-4 py-3 text-navy-600">{lead.city || "—"}</td>
                  <td className="px-4 py-3 text-navy-600">{lead.sector || "—"}</td>
                  <td className="px-4 py-3 text-navy-600">
                    {lead.emails.length > 0 ? `${lead.emails.length} found` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={lead.aiUsageScore} />
                  </td>
                  <td className="px-4 py-3 text-navy-500">{lead.discoverySource}</td>
                  <td className="px-4 py-3 text-navy-500">{lead.discoveredAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-navy-900/30" onClick={() => setSelectedId(null)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-navy-900">{selectedLead.companyName}</h2>
              <button type="button" onClick={() => setSelectedId(null)} className="text-navy-400 hover:text-navy-700">
                Close
              </button>
            </div>
            <p className="mt-1 text-sm text-navy-500">
              {selectedLead.city || "—"} · {selectedLead.sector || "—"}
            </p>

            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-400">AI usage score</h3>
              <div className="mt-2">
                <ScoreBadge score={selectedLead.aiUsageScore} />
              </div>
              {selectedLead.scoreRationale && selectedLead.scoreRationale.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-sm text-navy-600">
                  {selectedLead.scoreRationale.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-navy-500">Not scored yet.</p>
              )}
            </section>

            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-400">Source</h3>
              <p className="mt-2 text-sm text-navy-600">{selectedLead.discoverySource}</p>
              {selectedLead.websiteUrl && (
                <a href={selectedLead.websiteUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-accent hover:text-accent-600">
                  {selectedLead.websiteUrl}
                </a>
              )}
            </section>

            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-400">Emails</h3>
              {selectedLead.emails.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {selectedLead.emails.map((email, i) => (
                    <li key={i} className="rounded-md border border-navy-100 p-2 text-sm">
                      <p className="font-medium text-navy-900">{email.address}</p>
                      <p className="text-xs text-navy-500">
                        {CONFIDENCE_LABELS[email.confidence] ?? email.confidence}
                        {email.name ? ` · ${email.name}` : ""}
                        {email.position ? ` (${email.position})` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-navy-500">{selectedLead.emailSearchNote ?? "No emails found yet."}</p>
              )}
              {selectedLead.contactHint && (
                <p className="mt-2 text-xs text-navy-500">Contact hint from import: {selectedLead.contactHint}</p>
              )}
            </section>

            {(selectedLead.manualPriority || selectedLead.notes) && (
              <section className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-400">Notes</h3>
                {selectedLead.manualPriority && <p className="mt-2 text-sm text-navy-600">Priority: {selectedLead.manualPriority}</p>}
                {selectedLead.notes && <p className="mt-1 text-sm text-navy-600">{selectedLead.notes}</p>}
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  field,
  label,
  sortField,
  sortDirection,
  onSort,
}: {
  field: LeadSortField;
  label: string;
  sortField: LeadSortField;
  sortDirection: LeadSortDirection;
  onSort: (field: LeadSortField) => void;
}) {
  const active = field === sortField;
  return (
    <th className="px-4 py-3">
      <button type="button" onClick={() => onSort(field)} className="flex items-center gap-1 hover:text-navy-700">
        {label}
        {active && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}
