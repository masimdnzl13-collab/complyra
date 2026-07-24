"use client";

import { useState } from "react";
import type { EmployeeCountRange } from "@/lib/firestore/schema";
import type { AiRoleAnswer, EuRelationAnswer, ScanResult, UseCase } from "@/lib/risk-scan/types";
import { trackEvent } from "@/lib/analytics/track";
import { FindingCard } from "./finding-card";

type StepId = "eu" | "role" | "usecases" | "audience" | "size" | "result";
const STEP_ORDER: StepId[] = ["eu", "role", "usecases", "audience", "size"];

interface AnswersState {
  euRelation: EuRelationAnswer | null;
  aiRole: AiRoleAnswer | null;
  useCases: UseCase[];
  vulnerableAudience: boolean | null;
  companySize: EmployeeCountRange | "";
}

const INITIAL_ANSWERS: AnswersState = {
  euRelation: null,
  aiRole: null,
  useCases: [],
  vulnerableAudience: null,
  companySize: "",
};

const EU_OPTIONS: { value: EuRelationAnswer; label: string }[] = [
  { value: "based", label: "We're legally established in the EU" },
  { value: "sells", label: "We sell products or services into the EU" },
  { value: "neither", label: "Neither of these" },
];

const ROLE_OPTIONS: { value: AiRoleAnswer; label: string; help: string }[] = [
  { value: "provider", label: "We build AI into our own product", help: "You're a “provider” under the Act." },
  { value: "deployer", label: "We use other companies' AI tools internally", help: "You're a “deployer” under the Act." },
  { value: "both", label: "Both of these", help: "" },
];

const USE_CASE_OPTIONS: { value: UseCase; label: string }[] = [
  { value: "hiring", label: "Hiring or evaluating employees" },
  { value: "credit_insurance", label: "Credit or insurance decisions" },
  { value: "education", label: "Evaluating students or exams" },
  { value: "chatbot", label: "A chatbot or voice assistant that talks to customers" },
  { value: "content_generation", label: "Generating content (text, images, video)" },
  { value: "biometric", label: "Facial recognition or biometric analysis" },
  { value: "emotion_monitoring", label: "Monitoring employee emotion or behavior" },
  { value: "none", label: "None of these" },
];

const EMPLOYEE_COUNT_RANGES: EmployeeCountRange[] = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const optionButtonClass = (selected: boolean) =>
  `w-full rounded-lg border-2 px-5 py-4 text-left text-base font-medium transition-colors ${
    selected
      ? "border-accent bg-accent-50 text-navy-900"
      : "border-navy-100 text-navy-700 hover:border-navy-200 hover:bg-navy-50"
  }`;

export function ScannerWizard() {
  const [step, setStep] = useState<StepId>("eu");
  const [answers, setAnswers] = useState<AnswersState>(INITIAL_ANSWERS);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);

  async function submitScan(payload: Record<string, unknown>) {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/risk-scan/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      const data: ScanResult = await response.json();
      setResult(data);
      trackEvent("risk_scan_completed");
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectEuRelation(value: EuRelationAnswer) {
    setAnswers((prev) => ({ ...prev, euRelation: value }));
    trackEvent("risk_scan_started");
    if (value === "neither") {
      submitScan({ euRelation: "neither" });
    } else {
      setStep("role");
    }
  }

  function selectRole(value: AiRoleAnswer) {
    setAnswers((prev) => ({ ...prev, aiRole: value }));
    setStep("usecases");
  }

  function toggleUseCase(value: UseCase) {
    setAnswers((prev) => {
      if (value === "none") {
        return { ...prev, useCases: prev.useCases.includes("none") ? [] : ["none"] };
      }
      const withoutNone = prev.useCases.filter((u) => u !== "none");
      const has = withoutNone.includes(value);
      return { ...prev, useCases: has ? withoutNone.filter((u) => u !== value) : [...withoutNone, value] };
    });
  }

  function selectAudience(value: boolean) {
    setAnswers((prev) => ({ ...prev, vulnerableAudience: value }));
    setStep("size");
  }

  function selectSize(value: EmployeeCountRange) {
    const finalAnswers = { ...answers, companySize: value };
    setAnswers(finalAnswers);
    submitScan({
      euRelation: finalAnswers.euRelation,
      aiRole: finalAnswers.aiRole,
      useCases: finalAnswers.useCases,
      vulnerableAudience: finalAnswers.vulnerableAudience,
      companySize: value,
    });
  }

  function retake() {
    setAnswers(INITIAL_ANSWERS);
    setResult(null);
    setError(null);
    setStep("eu");
  }

  if (step === "result" && result) {
    return <ResultScreen result={result} answers={answers} onRetake={retake} />;
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="mb-8 flex items-center gap-2">
        {STEP_ORDER.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-accent" : "bg-navy-100"}`} />
        ))}
      </div>

      <div className="rounded-xl border border-navy-100 bg-surface p-8 shadow-sm">
        {step === "eu" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">Where does your company stand with the EU?</h1>
            <p className="mt-1 text-sm text-navy-600">Question 1</p>
            <div className="mt-6 space-y-3">
              {EU_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => selectEuRelation(opt.value)}
                  className={optionButtonClass(answers.euRelation === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "role" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">How does AI show up in your company?</h1>
            <p className="mt-1 text-sm text-navy-600">Question 2</p>
            <div className="mt-6 space-y-3">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => selectRole(opt.value)}
                  className={optionButtonClass(answers.aiRole === opt.value)}
                >
                  {opt.label}
                  {opt.help && <span className="mt-1 block text-xs font-normal text-navy-500">{opt.help}</span>}
                </button>
              ))}
            </div>
            <BackButton onClick={() => setStep("eu")} />
          </div>
        )}

        {step === "usecases" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">What does your AI actually do?</h1>
            <p className="mt-1 text-sm text-navy-600">Question 3 — select all that apply</p>
            <div className="mt-6 space-y-2">
              {USE_CASE_OPTIONS.map((opt) => {
                const selected = answers.useCases.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm ${
                      selected ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-accent"
                      checked={selected}
                      onChange={() => toggleUseCase(opt.value)}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
            <div className="mt-8 flex gap-3">
              <BackButton onClick={() => setStep("role")} plain />
              <button
                type="button"
                disabled={answers.useCases.length === 0}
                onClick={() => setStep("audience")}
                className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "audience" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">
              Does your customer base include children or other vulnerable groups?
            </h1>
            <p className="mt-1 text-sm text-navy-600">Question 4</p>
            <div className="mt-6 flex gap-3">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => selectAudience(value)}
                  className={optionButtonClass(answers.vulnerableAudience === value)}
                >
                  {value ? "Yes" : "No"}
                </button>
              ))}
            </div>
            <BackButton onClick={() => setStep("usecases")} />
          </div>
        )}

        {step === "size" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">How many people work at your company?</h1>
            <p className="mt-1 text-sm text-navy-600">Question 5 of 5</p>
            <div className="mt-6 space-y-2">
              {EMPLOYEE_COUNT_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => selectSize(range)}
                  className={optionButtonClass(answers.companySize === range)}
                >
                  {range} employees
                </button>
              ))}
            </div>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            {isSubmitting && <p className="mt-4 text-sm text-navy-500">Scoring your results…</p>}
            <BackButton onClick={() => setStep("audience")} />
          </div>
        )}

        {step === "eu" && error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

function BackButton({ onClick, plain }: { onClick: () => void; plain?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        plain
          ? "rounded-md border border-navy-100 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
          : "mt-6 text-sm font-medium text-navy-500 hover:text-navy-900"
      }
    >
      Back
    </button>
  );
}

function ResultScreen({
  result,
  answers,
  onRetake,
}: {
  result: ScanResult;
  answers: AnswersState;
  onRetake: () => void;
}) {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [failedReportUrl, setFailedReportUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus("sending");
    setEmailError(null);
    setFailedReportUrl(null);
    try {
      const response = await fetch("/api/risk-scan/email-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          answers: {
            euRelation: answers.euRelation,
            aiRole: answers.aiRole,
            useCases: answers.useCases,
            vulnerableAudience: answers.vulnerableAudience,
            companySize: answers.companySize,
          },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (typeof body.reportUrl === "string") setFailedReportUrl(body.reportUrl);
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setEmailStatus("sent");
    } catch (err) {
      setEmailStatus("error");
      setEmailError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/risk-scan`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard access can fail silently (permissions/insecure context) — non-critical, just skip the confirmation.
    }
  }

  if (result.earlyExit) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="rounded-full bg-navy-50 px-4 py-1 text-sm font-medium text-navy-600 inline-block">Your result</p>
        <h1 className="mt-6 text-2xl font-semibold text-navy-900">Not covered — yet</h1>
        <p className="mt-4 text-navy-600">{result.earlyExitMessage}</p>
        <button
          type="button"
          onClick={onRetake}
          className="mt-8 rounded-md border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 hover:bg-navy-50"
        >
          Retake the scan
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <p className="rounded-full bg-navy-50 px-4 py-1 text-sm font-medium text-navy-600 inline-block">Your result</p>
        <h1 className="mt-6 text-2xl font-semibold text-navy-900">
          {result.matchedAreas} of {result.totalAreas} EU AI Act areas apply to your company
        </h1>
        <p className="mt-2 text-navy-600">
          Profile: {result.profile?.role === "provider" ? "AI provider" : result.profile?.role === "deployer" ? "AI deployer" : "AI provider & deployer"}
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {result.findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-navy-100 bg-navy-50 p-6 text-center">
        {emailStatus === "sent" ? (
          <p className="text-sm font-medium text-success">Check your inbox — your detailed report is on its way.</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-navy-900">Get your detailed report by email</h2>
            <p className="mt-2 text-sm text-navy-600">
              A private link with a paragraph on each finding, its legal basis, and your next step.
            </p>
            <form onSubmit={handleEmailSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-md border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:min-w-[280px]"
              />
              <button
                type="submit"
                disabled={emailStatus === "sending"}
                className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                {emailStatus === "sending" ? "Sending…" : "Email my report"}
              </button>
            </form>
            {emailStatus === "error" && emailError && (
              <p className="mt-2 text-sm text-danger">
                {emailError}
                {failedReportUrl && (
                  <>
                    {" "}
                    <a href={failedReportUrl} className="font-medium underline hover:text-danger/80">
                      View your report directly
                    </a>
                    .
                  </>
                )}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
        <button type="button" onClick={handleShare} className="font-medium text-navy-600 hover:text-navy-900">
          {shareCopied ? "Link copied!" : "Share this tool"}
        </button>
        <button type="button" onClick={onRetake} className="font-medium text-navy-600 hover:text-navy-900">
          Retake the scan
        </button>
      </div>
    </div>
  );
}
