import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { regulationDeadlines } from "@/config/site";
import { CountdownCard } from "@/components/marketing/countdown-card";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export const metadata = constructMetadata({
  title: "Compliance for High-Risk AI Systems Under Annex III",
  description:
    "Risk management, technical documentation, and human oversight for high-risk AI systems — ahead of the December 2027 deadline.",
  path: "/high-risk-ai-systems",
});

const highRiskDeadline = regulationDeadlines.find((d) => d.id === "high-risk")!;

const riskCategories = [
  { title: "Employment & HR", detail: "CV screening, candidate ranking, performance monitoring, and promotion/termination decisions." },
  { title: "Credit & insurance", detail: "Creditworthiness scoring and risk pricing that affects access to essential financial services." },
  { title: "Education", detail: "Admission decisions, exam scoring, and systems evaluating learning outcomes." },
  { title: "Law enforcement", detail: "Risk assessment, evidence evaluation, and profiling used in a law-enforcement context." },
  { title: "Migration & border control", detail: "Visa, asylum, and border-control risk assessment or verification systems." },
  { title: "Justice & democratic processes", detail: "Systems assisting judicial decision-making or influencing elections." },
];

const modules = [
  { title: "Risk assessment", detail: "Classify each system against Annex III with a documented legal justification." },
  { title: "Technical documentation", detail: "The documentation packet Article 11 requires, generated from your system inventory." },
  { title: "Human oversight", detail: "Oversight procedures matched to how autonomously the system actually operates." },
  { title: "Audit trail", detail: "A versioned record of every classification and document, ready to show a regulator." },
];

export default function HighRiskAiSystemsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Compliance for High-Risk AI Systems Under Annex III</h1>
        <p className="mt-4 text-lg text-navy-600">
          Full risk-management, documentation, and human-oversight obligations apply to high-risk systems. Here&apos;s what that means and how to prepare.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/risk-scan" className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-600">
            Assess your systems
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <CountdownCard deadline={highRiskDeadline} />
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-navy-900">Annex III high-risk categories</h2>
        <div className="mt-4 space-y-3">
          {riskCategories.map((c) => (
            <details key={c.title} className="group rounded-xl border border-navy-100 bg-surface p-4">
              <summary className="cursor-pointer text-sm font-semibold text-navy-900">{c.title}</summary>
              <p className="mt-2 text-sm text-navy-600">{c.detail}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-navy-900">What Complyra covers</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {modules.map((m) => (
            <div key={m.title} className="rounded-xl border border-navy-100 bg-navy-50 p-5">
              <p className="text-sm font-semibold text-navy-900">{m.title}</p>
              <p className="mt-1 text-sm text-navy-600">{m.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-navy-100 bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-navy-900">Get regulatory updates</p>
        <p className="mt-1 text-sm text-navy-600">A short email when something in the Act actually changes.</p>
        <div className="mt-4 flex justify-center">
          <NewsletterForm />
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-navy-400">
        This is a documentation preparation tool, not legal advice. Consult a qualified professional for advice on your specific obligations.
      </p>
    </div>
  );
}
