"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArchiveButton({ systemId }: { systemId: string }) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    if (!confirm("Archive this system? It stays in your records but no longer counts toward your active inventory.")) {
      return;
    }
    setIsArchiving(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai-systems/${systemId}/archive`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsArchiving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={isArchiving}
        onClick={handleArchive}
        className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50"
      >
        {isArchiving ? "Archiving…" : "Archive system"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
