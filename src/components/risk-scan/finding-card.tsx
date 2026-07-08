import type { Finding, FindingSeverity } from "@/lib/risk-scan/types";

const SEVERITY_STYLES: Record<FindingSeverity, string> = {
  prohibited: "border-danger bg-danger/5",
  high: "border-warning bg-warning/5",
  transparency: "border-accent bg-accent/5",
  info: "border-navy-100 bg-navy-50",
};

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  prohibited: "Prohibited practice",
  high: "Likely high-risk",
  transparency: "Transparency obligation",
  info: "Always applies",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className={`rounded-xl border-2 p-5 ${SEVERITY_STYLES[finding.severity]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
            finding.severity === "prohibited" ? "bg-danger text-white" : "bg-navy-900/5 text-navy-700"
          }`}
        >
          {SEVERITY_LABELS[finding.severity]}
        </span>
        <span className="text-xs font-medium text-navy-500">
          {finding.inForce ? "In force" : `Effective ${dateFormatter.format(new Date(finding.effectiveDate))}`}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-navy-900">{finding.title}</h3>
      <p className="mt-2 text-sm text-navy-700">{finding.description}</p>
      <p className="mt-3 text-xs font-medium text-navy-500">{finding.legalReference} · EU AI Act</p>
      <p className="mt-2 text-sm text-navy-600">
        <span className="font-medium text-navy-900">Next step: </span>
        {finding.nextStep}
      </p>
    </div>
  );
}
