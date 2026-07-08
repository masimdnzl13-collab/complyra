"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApproveButton({ artifactId }: { artifactId: string }) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setIsApproving(true);
    setError(null);
    try {
      const response = await fetch(`/api/article50/${artifactId}/approve`, { method: "POST" });
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

  return (
    <div>
      <button
        type="button"
        disabled={isApproving}
        onClick={handleApprove}
        className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50 disabled:opacity-50"
      >
        {isApproving ? "Approving…" : "Review & publish"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
