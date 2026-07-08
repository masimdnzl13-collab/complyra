"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RegulatoryUpdateCategory } from "@/lib/firestore/schema";

const CATEGORY_OPTIONS: RegulatoryUpdateCategory[] = ["transparency", "high_risk", "prohibited", "general"];

export function AddRegulatoryUpdateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [category, setCategory] = useState<RegulatoryUpdateCategory>("general");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/regulatory-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, sourceUrl, category }),
      });
      if (!response.ok) throw new Error();
      setTitle("");
      setSummary("");
      setSourceUrl("");
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-100 bg-surface p-6">
      <h2 className="text-sm font-semibold text-navy-900">Add manual regulatory update</h2>
      <input
        required
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
      />
      <textarea
        required
        placeholder="Summary"
        rows={2}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
      />
      <input
        required
        placeholder="Source URL"
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as RegulatoryUpdateCategory)}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
      >
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c.replace("_", " ")}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {status === "saving" ? "Adding…" : "Add update"}
      </button>
      {status === "error" && <p className="text-xs text-danger">Failed to add.</p>}
    </form>
  );
}

export function DeleteRegulatoryUpdateButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm("Delete this regulatory update?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/regulatory-updates/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-medium text-danger hover:opacity-80 disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
