"use client";

import { useState } from "react";

interface TourStep {
  title: string;
  articleReference: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    title: "Dashboard",
    articleReference: "Your compliance score, at a glance",
    body: "The compliance score and the two countdown timers here summarize everything else in the app — they move as you register systems, run assessments, generate documents, and complete training. Check back here first each time you log in.",
  },
  {
    title: "AI Systems",
    articleReference: "Article 6 — the inventory that everything else depends on",
    body: "Every AI system your company builds or uses needs a record here — name, purpose, vendor, and how it's used. This is the first step for a reason: you can't classify risk or generate documents for a system that isn't registered yet.",
  },
  {
    title: "Risk Assessments",
    articleReference: "Article 6 & Annex III — classification",
    body: "Each registered system gets classified — unacceptable, high-risk, limited-risk, or minimal-risk — based on how it's used, not just what it is. Start by assessing your systems that touch hiring, credit, or other Annex III decision points first; those carry the most obligations.",
  },
  {
    title: "Documents",
    articleReference: "Articles 11–13 — technical documentation & conformity",
    body: "High-risk systems need generated compliance documentation (technical files, conformity statements). Vermoncy drafts these from your system and assessment data — review and approve each one before treating it as final.",
  },
  {
    title: "Article 50",
    articleReference: "Article 50 — transparency obligations, in force August 2, 2026",
    body: "If any system talks to people, generates synthetic content, or produces deepfakes, it needs a disclosure notice, content label, or watermark plan under Article 50. This deadline applies regardless of risk tier — even minimal-risk systems can trigger it.",
  },
  {
    title: "AI Literacy",
    articleReference: "Article 4 — staff training requirement",
    body: "Article 4 requires everyone involved in operating your AI systems to have adequate AI literacy. Enroll your team here and track completion — an unassessed system is a gap, but an untrained team is too.",
  },
  {
    title: "Expert Reviews",
    articleReference: "For borderline classifications",
    body: "When a risk classification is genuinely ambiguous — Vermoncy will flag these as edge cases — you can request a human expert review from a compliance consultant instead of relying on the automated classification alone.",
  },
  {
    title: "Billing",
    articleReference: "Plan limits & usage",
    body: "Your plan caps how many systems, assessments, documents, and expert reviews you get each month. Check this page if a feature says you've hit a limit, or to compare plans before you scale up.",
  },
];

export function OnboardingTour({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  async function markComplete() {
    setOpen(false);
    try {
      await fetch("/api/onboarding-tour/complete", { method: "POST" });
    } catch {
      // Best-effort — worst case the tour reappears next visit, which is harmless.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <button
            onClick={markComplete}
            aria-label="Close tour"
            className="text-navy-400 hover:text-navy-600"
          >
            ✕
          </button>
        </div>

        <h2 className="mt-3 text-xl font-semibold text-navy-900">{step.title}</h2>
        <p className="mt-1 text-xs font-medium text-navy-500">{step.articleReference}</p>
        <p className="mt-3 text-sm text-navy-600">{step.body}</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === stepIndex ? "bg-accent" : "bg-navy-200"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={() => setStepIndex((i) => i - 1)}
                className="rounded-md border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLastStep ? markComplete() : setStepIndex((i) => i + 1))}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              {isLastStep ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
