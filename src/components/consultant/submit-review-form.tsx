"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubmitReviewForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [legalAnalysis, setLegalAnalysis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/consultant/cases/${caseId}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executiveSummary, legalAnalysis, recommendation }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-navy-100 bg-surface p-6">
      <h2 className="text-sm font-semibold text-navy-900">Submit review</h2>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Executive summary</span>
        <textarea
          required
          rows={3}
          placeholder="1–2 paragraphs summarizing your conclusion"
          value={executiveSummary}
          onChange={(e) => setExecutiveSummary(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Legal analysis</span>
        <textarea
          required
          rows={6}
          placeholder="Relevant articles, guidelines, and contested points"
          value={legalAnalysis}
          onChange={(e) => setLegalAnalysis(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Recommendation</span>
        <textarea
          required
          rows={4}
          placeholder="Revised risk tier suggestion, action items, next steps"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
