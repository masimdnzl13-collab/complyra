"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AffectedGroup,
  AiDataType,
  AiSystemRole,
  BusinessArea,
  DecisionMakingRole,
} from "@/lib/firestore/schema";
import type { AiSystemInput } from "@/lib/ai-systems/validate";

type StepId = "identity" | "role" | "vendor" | "usage" | "data" | "impact" | "visibility" | "summary";
const STEP_ORDER: StepId[] = ["identity", "role", "vendor", "usage", "data", "impact", "visibility", "summary"];

interface WizardState {
  name: string;
  description: string;
  role: AiSystemRole | null;
  vendor: string;
  vendorPreset: string;
  vendorFreeText: string;
  businessArea: BusinessArea | null;
  purpose: string;
  dataTypes: AiDataType[];
  affectedGroups: AffectedGroup[];
  decisionMakingRole: DecisionMakingRole | null;
  interactsWithPeople: boolean | null;
  generatesSyntheticContent: boolean | null;
  infersEmotionOrBehavior: boolean | null;
}

function emptyState(): WizardState {
  return {
    name: "",
    description: "",
    role: null,
    vendor: "",
    vendorPreset: "",
    vendorFreeText: "",
    businessArea: null,
    purpose: "",
    dataTypes: [],
    affectedGroups: [],
    decisionMakingRole: null,
    interactsWithPeople: null,
    generatesSyntheticContent: null,
    infersEmotionOrBehavior: null,
  };
}

function fromInitialData(data: AiSystemInput): WizardState {
  return {
    name: data.name,
    description: data.description,
    role: data.role,
    vendor: data.vendor,
    vendorPreset: "",
    vendorFreeText: data.vendor,
    businessArea: data.businessArea,
    purpose: data.purpose,
    dataTypes: data.dataTypes,
    affectedGroups: data.affectedGroups,
    decisionMakingRole: data.decisionMakingRole,
    interactsWithPeople: data.interactsWithPeople,
    generatesSyntheticContent: data.generatesSyntheticContent,
    infersEmotionOrBehavior: data.infersEmotionOrBehavior,
  };
}

const FOUNDATION_MODEL_PRESETS = [
  "OpenAI (GPT)",
  "Anthropic (Claude)",
  "Google (Gemini)",
  "Azure OpenAI Service",
  "AWS Bedrock",
  "Meta (Llama)",
  "Mistral",
  "Self-hosted / open-source",
  "Other",
];

const BUSINESS_AREA_OPTIONS: { value: BusinessArea; label: string }[] = [
  { value: "hr", label: "Human resources" },
  { value: "customer_service", label: "Customer service" },
  { value: "marketing_content", label: "Marketing / content" },
  { value: "finance_credit", label: "Finance / credit" },
  { value: "product_feature", label: "Product feature" },
  { value: "operations", label: "Operations" },
  { value: "other", label: "Other" },
];

const DATA_TYPE_OPTIONS: { value: AiDataType; label: string }[] = [
  { value: "personal", label: "Personal data" },
  { value: "sensitive_personal", label: "Sensitive personal data" },
  { value: "biometric", label: "Biometric data" },
  { value: "customer", label: "Customer data" },
  { value: "employee", label: "Employee data" },
  { value: "anonymous_corporate", label: "Anonymous / corporate data" },
];

const AFFECTED_GROUP_OPTIONS: { value: AffectedGroup; label: string }[] = [
  { value: "employees", label: "Employees" },
  { value: "job_applicants", label: "Job applicants" },
  { value: "customers", label: "Customers" },
  { value: "children_vulnerable", label: "Children or vulnerable groups" },
  { value: "general_public", label: "General public" },
];

const DECISION_ROLE_OPTIONS: { value: DecisionMakingRole; label: string; help: string }[] = [
  { value: "info_only", label: "Only provides information or suggestions", help: "A person makes the actual decision." },
  { value: "human_in_the_loop", label: "Feeds into a human decision", help: "Its output is one input among several a person weighs." },
  { value: "autonomous", label: "Decides on its own, without human approval", help: "The output takes effect without a person signing off." },
];

const inputClass =
  "w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const optionButtonClass = (selected: boolean) =>
  `w-full rounded-lg border-2 px-5 py-3 text-left text-sm font-medium transition-colors ${
    selected
      ? "border-accent bg-accent-50 text-navy-900"
      : "border-navy-100 text-navy-700 hover:border-navy-200 hover:bg-navy-50"
  }`;

interface SystemWizardProps {
  mode: "create" | "edit";
  systemId?: string;
  initialData?: AiSystemInput;
}

export function SystemWizard({ mode, systemId, initialData }: SystemWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("identity");
  const [state, setState] = useState<WizardState>(initialData ? fromInitialData(initialData) : emptyState());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepIndex = STEP_ORDER.indexOf(step);
  function goTo(s: StepId) {
    setStep(s);
  }
  function next() {
    setStep(STEP_ORDER[stepIndex + 1]);
  }
  function back() {
    setStep(STEP_ORDER[stepIndex - 1]);
  }

  const identityValid = state.name.trim().length > 0 && state.description.trim().length > 0;
  const vendorValue =
    state.role === "provider"
      ? state.vendorPreset === "Other" || state.vendorPreset === "" ? state.vendorFreeText : state.vendorPreset
      : state.vendorFreeText;
  const vendorValid = vendorValue.trim().length > 0;
  const usageValid = state.businessArea !== null && state.purpose.trim().length > 0;
  const dataValid = state.dataTypes.length > 0;
  const impactValid = state.affectedGroups.length > 0 && state.decisionMakingRole !== null;
  const visibilityValid =
    state.interactsWithPeople !== null &&
    state.generatesSyntheticContent !== null &&
    state.infersEmotionOrBehavior !== null;

  function toggleMulti<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    const payload: AiSystemInput = {
      name: state.name.trim(),
      description: state.description.trim(),
      role: state.role!,
      vendor: vendorValue.trim(),
      businessArea: state.businessArea!,
      purpose: state.purpose.trim(),
      dataTypes: state.dataTypes,
      affectedGroups: state.affectedGroups,
      decisionMakingRole: state.decisionMakingRole!,
      interactsWithPeople: state.interactsWithPeople!,
      generatesSyntheticContent: state.generatesSyntheticContent!,
      infersEmotionOrBehavior: state.infersEmotionOrBehavior!,
    };

    try {
      const url = mode === "create" ? "/api/ai-systems" : `/api/ai-systems/${systemId}`;
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      const data = await response.json();
      const targetId = mode === "create" ? data.id : systemId;
      router.push(`/ai-systems/${targetId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="mb-8 flex items-center gap-2">
        {STEP_ORDER.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-accent" : "bg-navy-100"}`} />
        ))}
      </div>

      <div className="rounded-xl border border-navy-100 bg-surface p-8 shadow-sm">
        {step === "identity" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">What&apos;s this system called?</h1>
            <p className="mt-1 text-sm text-navy-600">Step 1 of 8 — a name and a short description are enough to start.</p>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">System name</span>
                <input
                  className={inputClass}
                  value={state.name}
                  onChange={(e) => setState({ ...state, name: e.target.value })}
                  placeholder="e.g. Support chatbot"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">Short description</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={state.description}
                  onChange={(e) => setState({ ...state, description: e.target.value })}
                  placeholder="One or two sentences — what is it, in plain terms?"
                />
              </label>
            </div>
            <NextButton disabled={!identityValid} onClick={next} />
          </div>
        )}

        {step === "role" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">Is this your own system, or one you use?</h1>
            <p className="mt-1 text-sm text-navy-600">Step 2 of 8</p>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => { setState({ ...state, role: "provider" }); next(); }}
                className={optionButtonClass(state.role === "provider")}
              >
                We built it or offer it under our own brand
                <span className="mt-1 block text-xs font-normal text-navy-500">You&apos;re a “provider” for this system.</span>
              </button>
              <button
                type="button"
                onClick={() => { setState({ ...state, role: "deployer" }); next(); }}
                className={optionButtonClass(state.role === "deployer")}
              >
                We use a tool someone else built
                <span className="mt-1 block text-xs font-normal text-navy-500">You&apos;re a “deployer” for this system.</span>
              </button>
            </div>
            <BackLink onClick={back} />
          </div>
        )}

        {step === "vendor" && (
          <div>
            {state.role === "provider" ? (
              <>
                <h1 className="text-xl font-semibold text-navy-900">What&apos;s it built on?</h1>
                <p className="mt-1 text-sm text-navy-600">Step 3 of 8 — the foundation model or infrastructure underneath.</p>
                <div className="mt-6 space-y-2">
                  {FOUNDATION_MODEL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setState({ ...state, vendorPreset: preset })}
                      className={optionButtonClass(state.vendorPreset === preset)}
                    >
                      {preset}
                    </button>
                  ))}
                  {(state.vendorPreset === "Other" || state.vendorPreset === "") && (
                    <input
                      className={inputClass}
                      value={state.vendorFreeText}
                      onChange={(e) => setState({ ...state, vendorFreeText: e.target.value })}
                      placeholder="Type it in if it's not listed"
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-navy-900">Which company and product?</h1>
                <p className="mt-1 text-sm text-navy-600">Step 3 of 8</p>
                <input
                  className={`${inputClass} mt-6`}
                  value={state.vendorFreeText}
                  onChange={(e) => setState({ ...state, vendorFreeText: e.target.value })}
                  placeholder="e.g. Zendesk — Answer Bot"
                />
              </>
            )}
            <NextButton disabled={!vendorValid} onClick={next} />
            <BackLink onClick={back} />
          </div>
        )}

        {step === "usage" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">Where is it used, and what does it do?</h1>
            <p className="mt-1 text-sm text-navy-600">Step 4 of 8</p>
            <div className="mt-6 space-y-4">
              <div>
                <span className="mb-2 block text-sm font-medium text-navy-900">Business area</span>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_AREA_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setState({ ...state, businessArea: opt.value })}
                      className={optionButtonClass(state.businessArea === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-navy-900">What does it concretely do?</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={state.purpose}
                  onChange={(e) => setState({ ...state, purpose: e.target.value })}
                  placeholder="e.g. Answers customer support questions and escalates complex ones"
                />
              </label>
            </div>
            <NextButton disabled={!usageValid} onClick={next} />
            <BackLink onClick={back} />
          </div>
        )}

        {step === "data" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">What kind of data does it work with?</h1>
            <p className="mt-1 text-sm text-navy-600">Step 5 of 8 — select all that apply</p>
            <div className="mt-6 space-y-2">
              {DATA_TYPE_OPTIONS.map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
                  checked={state.dataTypes.includes(opt.value)}
                  onChange={() => setState({ ...state, dataTypes: toggleMulti(state.dataTypes, opt.value) })}
                />
              ))}
            </div>
            <NextButton disabled={!dataValid} onClick={next} />
            <BackLink onClick={back} />
          </div>
        )}

        {step === "impact" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">Who&apos;s affected, and how much control do people have?</h1>
            <p className="mt-1 text-sm text-navy-600">Step 6 of 8</p>
            <div className="mt-6 space-y-4">
              <div>
                <span className="mb-2 block text-sm font-medium text-navy-900">Who&apos;s affected by its output? Select all that apply.</span>
                <div className="space-y-2">
                  {AFFECTED_GROUP_OPTIONS.map((opt) => (
                    <Checkbox
                      key={opt.value}
                      label={opt.label}
                      checked={state.affectedGroups.includes(opt.value)}
                      onChange={() => setState({ ...state, affectedGroups: toggleMulti(state.affectedGroups, opt.value) })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-navy-900">Its role in the decision:</span>
                <div className="space-y-2">
                  {DECISION_ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setState({ ...state, decisionMakingRole: opt.value })}
                      className={optionButtonClass(state.decisionMakingRole === opt.value)}
                    >
                      {opt.label}
                      <span className="mt-1 block text-xs font-normal text-navy-500">{opt.help}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <NextButton disabled={!impactValid} onClick={next} />
            <BackLink onClick={back} />
          </div>
        )}

        {step === "visibility" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">A few quick yes/no questions</h1>
            <p className="mt-1 text-sm text-navy-600">Step 7 of 8</p>
            <div className="mt-6 space-y-5">
              <YesNo
                question="Does it talk directly with people (chatbot, voice assistant)?"
                value={state.interactsWithPeople}
                onChange={(v) => setState({ ...state, interactsWithPeople: v })}
              />
              <YesNo
                question="Does it generate synthetic content (text, images, audio, video)?"
                value={state.generatesSyntheticContent}
                onChange={(v) => setState({ ...state, generatesSyntheticContent: v })}
              />
              <YesNo
                question="Does it infer emotion or behavior?"
                value={state.infersEmotionOrBehavior}
                onChange={(v) => setState({ ...state, infersEmotionOrBehavior: v })}
              />
            </div>
            <NextButton disabled={!visibilityValid} onClick={next} />
            <BackLink onClick={back} />
          </div>
        )}

        {step === "summary" && (
          <div>
            <h1 className="text-xl font-semibold text-navy-900">Review before saving</h1>
            <p className="mt-1 text-sm text-navy-600">Step 8 of 8 — jump back to any section to fix it.</p>
            <div className="mt-6 space-y-4 text-sm">
              <SummaryRow label="Identity" onEdit={() => goTo("identity")}>
                <strong>{state.name}</strong> — {state.description}
              </SummaryRow>
              <SummaryRow label="Role" onEdit={() => goTo("role")}>
                {state.role === "provider" ? "Provider (our own system)" : "Deployer (a tool we use)"}
              </SummaryRow>
              <SummaryRow label="Built on / vendor" onEdit={() => goTo("vendor")}>
                {vendorValue}
              </SummaryRow>
              <SummaryRow label="Usage" onEdit={() => goTo("usage")}>
                {BUSINESS_AREA_OPTIONS.find((o) => o.value === state.businessArea)?.label} — {state.purpose}
              </SummaryRow>
              <SummaryRow label="Data types" onEdit={() => goTo("data")}>
                {state.dataTypes.map((d) => DATA_TYPE_OPTIONS.find((o) => o.value === d)?.label).join(", ")}
              </SummaryRow>
              <SummaryRow label="Impact" onEdit={() => goTo("impact")}>
                {state.affectedGroups.map((g) => AFFECTED_GROUP_OPTIONS.find((o) => o.value === g)?.label).join(", ")}
                {" · "}
                {DECISION_ROLE_OPTIONS.find((o) => o.value === state.decisionMakingRole)?.label}
              </SummaryRow>
              <SummaryRow label="Visibility" onEdit={() => goTo("visibility")}>
                {[
                  state.interactsWithPeople && "Talks to people",
                  state.generatesSyntheticContent && "Generates content",
                  state.infersEmotionOrBehavior && "Infers emotion/behavior",
                ]
                  .filter(Boolean)
                  .join(", ") || "None of these"}
              </SummaryRow>
            </div>

            {error && <p className="mt-4 text-sm text-danger">{error}</p>}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={back}
                className="rounded-md border border-navy-100 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : mode === "create" ? "Add system" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NextButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-8 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
    >
      Continue
    </button>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-4 text-sm font-medium text-navy-500 hover:text-navy-900">
      Back
    </button>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm ${
        checked ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
      }`}
    >
      <input type="checkbox" className="accent-accent" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function YesNo({
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
              value === option ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600 hover:bg-navy-50"
            }`}
          >
            {option ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-navy-100 pb-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
        <p className="mt-1 text-navy-800">{children}</p>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-xs font-medium text-accent hover:text-accent-600">
        Change
      </button>
    </div>
  );
}
