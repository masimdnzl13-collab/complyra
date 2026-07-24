"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentDoc, ComplianceDocumentType } from "@/lib/firestore/schema";
import { DOCUMENT_TEMPLATES, suggestDocumentTypes, type DocumentSuggestion } from "@/lib/documents/templates";
import { trackEvent } from "@/lib/analytics/track";

export interface AssessmentOption {
  id: string;
  assessment: Omit<AssessmentDoc, "createdAt">;
  systemName: string;
  systemRole: "provider" | "deployer";
}

const RISK_TIER_LABELS: Record<AssessmentDoc["riskTier"], string> = {
  unacceptable: "Prohibited practice",
  high: "High risk",
  limited: "Limited risk",
  minimal: "Minimal risk",
};

export function DocumentGeneratorForm({ assessments }: { assessments: AssessmentOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<AssessmentOption | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<ComplianceDocumentType>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickAssessment(option: AssessmentOption) {
    setSelected(option);
    setError(null);
    if (option.assessment.prohibitedPracticeDetected) {
      setSelectedTypes(new Set());
      return;
    }
    const suggestions = suggestDocumentTypes(option.assessment, option.systemRole);
    setSelectedTypes(new Set(suggestions.map((s: DocumentSuggestion) => s.type)));
  }

  function toggleType(type: ComplianceDocumentType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function handleGenerate() {
    if (!selected) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: selected.id, types: Array.from(selectedTypes) }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      trackEvent("document_generated", { assessmentId: selected.id, count: selectedTypes.size });
      router.push("/documents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (assessments.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-navy-900">No risk assessments yet</h1>
        <p className="mt-3 text-navy-600">
          Run a risk assessment on an AI system before generating documents for it.
        </p>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-xl font-semibold text-navy-900">Which risk assessment is this document for?</h1>
        <div className="mt-6 space-y-3">
          {assessments.map((option) => (
            <div
              key={option.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-surface p-5"
            >
              <div>
                <p className="font-semibold text-navy-900">{option.systemName}</p>
                <p className="mt-1 text-sm text-navy-600">{RISK_TIER_LABELS[option.assessment.riskTier]}</p>
              </div>
              <button
                type="button"
                onClick={() => pickAssessment(option)}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
              >
                Create document
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selected.assessment.prohibitedPracticeDetected) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="rounded-xl border-2 border-danger bg-danger/5 p-6">
          <h1 className="text-lg font-semibold text-navy-900">Documents can&apos;t be generated for this system</h1>
          <p className="mt-3 text-sm text-navy-700">
            {selected.systemName} was classified as a prohibited practice under the EU AI Act. No document can be
            generated while that finding stands — resolve the underlying use case and reassess first.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-6 rounded-md border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 hover:bg-navy-50"
        >
          Choose a different assessment
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-xl font-semibold text-navy-900">Which documents do you need for {selected.systemName}?</h1>
      <p className="mt-1 text-sm text-navy-600">
        We&apos;ve pre-selected the documents your risk classification typically requires — adjust as needed.
      </p>

      {selected.assessment.isEdgeCase && (
        <div className="mt-4 rounded-md bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning">
          This assessment was flagged as a borderline case — consider a Compliance Review by Expert alongside these documents.
        </div>
      )}

      <div className="mt-6 space-y-2">
        {Object.values(DOCUMENT_TEMPLATES).map((template) => (
          <label
            key={template.type}
            className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 text-sm ${
              selectedTypes.has(template.type) ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-accent"
              checked={selectedTypes.has(template.type)}
              onChange={() => toggleType(template.type)}
            />
            <span>
              <span className="block font-medium text-navy-900">{template.label}</span>
              <span className="block text-xs text-navy-500">{template.description}</span>
            </span>
          </label>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="rounded-md border border-navy-100 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={selectedTypes.size === 0 || isSubmitting}
          onClick={handleGenerate}
          className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {isSubmitting ? "Generating…" : `Generate ${selectedTypes.size || ""} document${selectedTypes.size === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}
