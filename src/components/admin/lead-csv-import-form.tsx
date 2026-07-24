"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  created: number;
  updated: number;
  skipped: Array<{ row: number; reason: string }>;
}

export function LeadCsvImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/leads/import", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Import failed. Please try again.");
      }
      setResult(body as ImportResult);
      setStatus("done");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Import failed. Please try again.");
    }
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-6">
      <h2 className="text-sm font-semibold text-navy-900">Import leads from CSV</h2>
      <p className="mt-1 text-sm text-navy-600">
        Columns: company_name, city, sector, source_url, contact_hint, priority, notes. Existing companies (matched by name) are updated, not duplicated.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="text-sm text-navy-700 file:mr-3 file:rounded-md file:border-0 file:bg-navy-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-navy-700 hover:file:bg-navy-200"
        />
        <button
          type="submit"
          disabled={status === "uploading"}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {status === "uploading" ? "Importing…" : "Import CSV"}
        </button>
      </form>
      {status === "done" && result && (
        <p className="mt-3 text-sm text-success">
          {result.created} created, {result.updated} updated
          {result.skipped.length > 0 ? `, ${result.skipped.length} skipped (missing company name)` : ""}.
        </p>
      )}
      {status === "error" && error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
