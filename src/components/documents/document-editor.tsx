"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ComplianceDocumentDoc, DocumentSection } from "@/lib/firestore/schema";

interface DocumentEditorProps {
  documentId: string;
  type: ComplianceDocumentDoc["type"];
  status: ComplianceDocumentDoc["status"];
  version: number;
  fixedFields: ComplianceDocumentDoc["fixedFields"];
  sections: DocumentSection[];
  templateLabel: string;
  isOwner: boolean;
}

const inputClass =
  "w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function DocumentEditor({
  documentId,
  status,
  version,
  fixedFields,
  sections: initialSections,
  templateLabel,
  isOwner,
}: DocumentEditorProps) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(fixedFields.companyName);
  const [systemName, setSystemName] = useState(fixedFields.systemName);
  const [preparedBy, setPreparedBy] = useState(fixedFields.preparedBy);
  const [sections, setSections] = useState(initialSections);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSection(id: string, content: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixedFields: { companyName, systemName, preparedBy },
          sections,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      const data = await response.json();
      router.push(`/documents/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSaving(false);
    }
  }

  async function handleApprove() {
    setIsApproving(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/approve`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this draft document? This can't be undone.")) return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.push("/documents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  }

  const canEdit = isOwner;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{templateLabel}</h1>
          <p className="mt-1 text-sm text-navy-600">Version {version}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            status === "reviewed" ? "bg-success/10 text-success" : "bg-navy-100 text-navy-500"
          }`}
        >
          {status === "reviewed" ? "Reviewed" : "Draft"}
        </span>
      </div>

      {canEdit && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          {status === "draft" && (
            <button
              type="button"
              disabled={isApproving}
              onClick={handleApprove}
              className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50 disabled:opacity-50"
            >
              {isApproving ? "Approving…" : "Review & approve"}
            </button>
          )}
          <a
            href={`/api/documents/${documentId}/pdf`}
            className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
          >
            Download PDF
          </a>
          {status === "draft" && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="rounded-md border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 rounded-xl border border-navy-100 bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Document details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-navy-500">Company name</span>
            <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={!canEdit} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-navy-500">System name</span>
            <input className={inputClass} value={systemName} onChange={(e) => setSystemName(e.target.value)} disabled={!canEdit} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-navy-500">Assessment date</span>
            <input className={inputClass} value={fixedFields.assessmentDate} disabled />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-navy-500">Prepared by</span>
            <input className={inputClass} value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} disabled={!canEdit} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-navy-500">Approved</span>
            <input className={inputClass} value={fixedFields.approvedAt ?? "Pending review"} disabled />
          </label>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl border border-navy-100 bg-surface p-6">
            <h2 className="text-sm font-semibold text-navy-900">{section.title}</h2>
            <textarea
              className={`${inputClass} mt-3`}
              rows={6}
              value={section.content}
              onChange={(e) => updateSection(section.id, e.target.value)}
              disabled={!canEdit}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
