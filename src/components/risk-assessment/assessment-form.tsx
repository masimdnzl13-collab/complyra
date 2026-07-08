"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AiSystemDoc, DecisionPoint, SystemDeploymentStage } from "@/lib/firestore/schema";

const DECISION_POINT_OPTIONS: { value: DecisionPoint; label: string }[] = [
  { value: "hiring_evaluation", label: "Hiring or employee evaluation" },
  { value: "credit_insurance", label: "Credit or insurance decisions" },
  { value: "education_exam", label: "Education or exam evaluation" },
  { value: "law_enforcement", label: "Law enforcement support" },
  { value: "migration_border", label: "Migration / border control" },
  { value: "public_benefits", label: "Public assistance / social benefits" },
  { value: "judicial_decision", label: "Judicial or court-related decisions" },
  { value: "none", label: "None of these" },
];

const DEPLOYMENT_STAGE_OPTIONS: { value: SystemDeploymentStage; label: string }[] = [
  { value: "production", label: "Currently in production" },
  { value: "testing", label: "In testing" },
  { value: "planned", label: "Planned" },
];

const inputClass =
  "w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function AssessmentForm({ system, systemId }: { system: AiSystemDoc; systemId: string }) {
  const router = useRouter();
  const [decisionPoint, setDecisionPoint] = useState<DecisionPoint | "">("");
  const [deploymentStage, setDeploymentStage] = useState<SystemDeploymentStage | "">("");
  const [lastModifiedAt, setLastModifiedAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = decisionPoint !== "" && deploymentStage !== "" && lastModifiedAt !== "";

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId,
          decisionPoint,
          systemDeploymentStage: deploymentStage,
          systemLastModifiedAt: lastModifiedAt,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.push(`/ai-systems/${systemId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-xl border border-navy-100 bg-navy-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Assessing</h2>
        <p className="mt-1 text-lg font-semibold text-navy-900">{system.name}</p>
        <p className="mt-1 text-sm text-navy-600">{system.description}</p>
        <p className="mt-2 text-xs text-navy-500">Vendor / built on: {system.vendor}</p>
      </div>

      <div className="mt-8 rounded-xl border border-navy-100 bg-surface p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-navy-900">A few questions before we assess this</h1>

        <div className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-navy-900">
              What&apos;s the most important decision point in this system?
            </label>
            <select
              className={inputClass}
              value={decisionPoint}
              onChange={(e) => setDecisionPoint(e.target.value as DecisionPoint)}
            >
              <option value="" disabled>
                Select one
              </option>
              {DECISION_POINT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy-900">Current status</label>
            <div className="flex gap-2">
              {DEPLOYMENT_STAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDeploymentStage(opt.value)}
                  className={`flex-1 rounded-md border-2 px-3 py-2 text-sm font-medium ${
                    deploymentStage === opt.value
                      ? "border-accent bg-accent-50 text-navy-900"
                      : "border-navy-100 text-navy-600 hover:bg-navy-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-navy-900">
              When was this system last substantially modified?
            </label>
            <input
              type="date"
              className={inputClass}
              value={lastModifiedAt}
              onChange={(e) => setLastModifiedAt(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
            <p className="mt-1 text-xs text-navy-500">
              A substantial modification resets this assessment&apos;s validity — you&apos;ll need to reassess after one.
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <button
          type="button"
          disabled={!valid || isSubmitting}
          onClick={handleSubmit}
          className="mt-8 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {isSubmitting ? "Assessing…" : "Run risk assessment"}
        </button>
      </div>
    </div>
  );
}
