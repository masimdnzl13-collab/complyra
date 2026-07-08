"use client";

import { useState } from "react";
import Link from "next/link";
import type { ConsultantLanguagePreference, PreferredTurnaround } from "@/lib/firestore/schema";

const TURNAROUND_OPTIONS: { value: PreferredTurnaround; label: string }[] = [
  { value: "24h", label: "24 hours" },
  { value: "2d", label: "2 days" },
  { value: "1w", label: "1 week" },
];

const LANGUAGE_OPTIONS: { value: ConsultantLanguagePreference; label: string }[] = [
  { value: "any", label: "No preference" },
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "tr", label: "Turkish" },
];

interface RequestExpertReviewProps {
  assessmentId: string;
  canRequest: boolean;
  defaultNotes: string;
}

export function RequestExpertReview({ assessmentId, canRequest, defaultNotes }: RequestExpertReviewProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(defaultNotes);
  const [preferredTurnaround, setPreferredTurnaround] = useState<PreferredTurnaround>("2d");
  const [languagePreference, setLanguagePreference] = useState<ConsultantLanguagePreference>("any");
  const [budgetCeiling, setBudgetCeiling] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!canRequest) {
    return (
      <div className="rounded-md border border-dashed border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-600">
        <Link href="/billing" className="font-medium text-accent hover:text-accent-600">
          Upgrade to Growth
        </Link>{" "}
        for expert review access.
      </div>
    );
  }

  if (status === "sent") {
    return (
      <p className="rounded-md bg-success/10 px-4 py-3 text-sm font-medium text-success">
        Your request has been submitted. You&apos;ll be matched with an expert soon.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
      >
        Request expert review
      </button>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const response = await fetch("/api/expert-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          userNotes: notes,
          preferredTurnaround,
          languagePreference,
          budgetCeiling: budgetCeiling ? Number(budgetCeiling) : null,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-navy-100 bg-white p-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Describe your specific concern or question</span>
        <textarea
          required
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Preferred turnaround time</span>
          <select
            value={preferredTurnaround}
            onChange={(e) => setPreferredTurnaround(e.target.value as PreferredTurnaround)}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {TURNAROUND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Consultant language</span>
          <select
            value={languagePreference}
            onChange={(e) => setLanguagePreference(e.target.value as ConsultantLanguagePreference)}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Budget ceiling (EUR, optional)</span>
        <input
          type="number"
          min={1}
          placeholder="e.g. 500"
          value={budgetCeiling}
          onChange={(e) => setBudgetCeiling(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <span className="mt-1 block text-xs text-navy-400">Consultants may not propose above this amount.</span>
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {status === "sending" ? "Submitting…" : "Request consultation"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
