"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AiUsageContext, EmployeeCountRange } from "@/lib/firestore/schema";

const EMPLOYEE_COUNT_RANGES: EmployeeCountRange[] = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const AI_USAGE_OPTIONS: { value: AiUsageContext; label: string }[] = [
  { value: "products", label: "In our products or services" },
  { value: "internal_processes", label: "In our internal processes" },
  { value: "both", label: "Both" },
];

interface WizardState {
  companyName: string;
  country: string;
  industry: string;
  employeeCountRange: EmployeeCountRange | "";
  isEuBased: boolean | null;
  sellsToEu: boolean | null;
  aiUsageContext: AiUsageContext | null;
}

const INITIAL_STATE: WizardState = {
  companyName: "",
  country: "",
  industry: "",
  employeeCountRange: "",
  isEuBased: null,
  sellsToEu: null,
  aiUsageContext: null,
};

const inputClass =
  "w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step1Valid =
    state.companyName.trim().length > 0 &&
    state.country.trim().length > 0 &&
    state.industry.trim().length > 0 &&
    state.employeeCountRange !== "";
  const step2Valid = state.isEuBased !== null && state.sellsToEu !== null;
  const step3Valid = state.aiUsageContext !== null;

  async function handleFinish() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: state.companyName.trim(),
          country: state.country.trim(),
          industry: state.industry.trim(),
          employeeCountRange: state.employeeCountRange,
          euRelation: { isEuBased: state.isEuBased, sellsToEu: state.sellsToEu },
          aiUsageContext: state.aiUsageContext,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-navy-100"}`}
          />
        ))}
      </div>

      <div className="rounded-xl border border-navy-100 bg-surface p-8 shadow-sm">
        {step === 1 && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">Tell us about your organization</h1>
            <p className="mt-1 text-sm text-navy-600">Step 1 of 3</p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">Company name</span>
                <input
                  className={inputClass}
                  value={state.companyName}
                  onChange={(e) => setState({ ...state, companyName: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">Country</span>
                <input
                  className={inputClass}
                  value={state.country}
                  onChange={(e) => setState({ ...state, country: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">Industry</span>
                <input
                  className={inputClass}
                  value={state.industry}
                  onChange={(e) => setState({ ...state, industry: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">Employee count</span>
                <select
                  className={inputClass}
                  value={state.employeeCountRange}
                  onChange={(e) =>
                    setState({ ...state, employeeCountRange: e.target.value as EmployeeCountRange })
                  }
                >
                  <option value="" disabled>
                    Select a range
                  </option>
                  {EMPLOYEE_COUNT_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="mt-8 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">Your relationship to the EU</h1>
            <p className="mt-1 text-sm text-navy-600">
              Step 2 of 3 — this shapes how we frame your risk assessment later.
            </p>

            <div className="mt-6 space-y-6">
              <YesNoQuestion
                question="Is your company legally established (based) in the EU?"
                value={state.isEuBased}
                onChange={(value) => setState({ ...state, isEuBased: value })}
              />
              <YesNoQuestion
                question="Does your company sell products or services into the EU market?"
                value={state.sellsToEu}
                onChange={(value) => setState({ ...state, sellsToEu: value })}
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-md border border-navy-100 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!step2Valid}
                onClick={() => setStep(3)}
                className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">Where does AI show up?</h1>
            <p className="mt-1 text-sm text-navy-600">Step 3 of 3</p>

            <div className="mt-6 space-y-2">
              {AI_USAGE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm ${
                    state.aiUsageContext === option.value
                      ? "border-accent bg-accent-50 text-navy-900"
                      : "border-navy-100 text-navy-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="aiUsageContext"
                    className="accent-accent"
                    checked={state.aiUsageContext === option.value}
                    onChange={() => setState({ ...state, aiUsageContext: option.value })}
                  />
                  {option.label}
                </label>
              ))}
            </div>

            {error && <p className="mt-4 text-sm text-danger">{error}</p>}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-md border border-navy-100 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!step3Valid || isSubmitting}
                onClick={handleFinish}
                className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                {isSubmitting ? "Setting up…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function YesNoQuestion({
  question,
  value,
  onChange,
}: {
  question: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-navy-900">{question}</p>
      <div className="flex gap-3">
        {[true, false].map((option) => (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-md border px-4 py-2 text-sm font-medium ${
              value === option
                ? "border-accent bg-accent-50 text-navy-900"
                : "border-navy-100 text-navy-600 hover:bg-navy-50"
            }`}
          >
            {option ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
