"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SendProposalForm({ caseId, defaultHourlyRate }: { caseId: string; defaultHourlyRate: number }) {
  const router = useRouter();
  const [hourlyRate, setHourlyRate] = useState(String(defaultHourlyRate || ""));
  const [estimatedTotal, setEstimatedTotal] = useState("");
  const [deliveryFormat, setDeliveryFormat] = useState("Written report (PDF)");
  const [scopeDescription, setScopeDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/consultant/cases/${caseId}/proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hourlyRate: Number(hourlyRate),
          estimatedTotal: Number(estimatedTotal),
          deliveryFormat,
          scopeDescription,
        }),
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
      <h2 className="text-sm font-semibold text-navy-900">Send proposal</h2>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Hourly rate (EUR)</span>
          <input
            required
            type="number"
            min={1}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Estimated total (EUR)</span>
          <input
            required
            type="number"
            min={1}
            value={estimatedTotal}
            onChange={(e) => setEstimatedTotal(e.target.value)}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Delivery format</span>
        <input
          required
          value={deliveryFormat}
          onChange={(e) => setDeliveryFormat(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Detailed scope</span>
        <textarea
          required
          rows={4}
          value={scopeDescription}
          onChange={(e) => setScopeDescription(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send proposal"}
      </button>
    </form>
  );
}
