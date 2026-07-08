import { DeadlineCountdown } from "@/components/article50/deadline-countdown";

interface ObligationRow {
  label: string;
  targetDate: string | null;
  inForceLabel?: string;
}

export function DualTimeline({
  transparencyDate,
  watermarkingDate,
  highRiskDate,
  annexIIINote,
}: {
  transparencyDate: string;
  watermarkingDate: string;
  highRiskDate: string;
  annexIIINote: string;
}) {
  const transparencyRows: ObligationRow[] = [
    { label: "Art. 50(1) chatbot disclosure", targetDate: transparencyDate },
    { label: "Art. 50(2) content marking / watermark", targetDate: watermarkingDate },
    { label: "Art. 4 AI literacy", targetDate: null, inForceLabel: "In effect since Feb 2025" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-navy-100 bg-surface p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-navy-900">Transparency Obligations</h2>
          <DeadlineCountdown targetDate={transparencyDate} />
        </div>
        <div className="mt-4 space-y-3">
          {transparencyRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-navy-600">{row.label}</span>
              {row.targetDate ? (
                <DeadlineCountdown targetDate={row.targetDate} />
              ) : (
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  {row.inForceLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-navy-100 bg-surface p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-navy-900">High-Risk Obligations</h2>
          <DeadlineCountdown targetDate={highRiskDate} />
        </div>
        <p className="mt-4 text-sm text-navy-600">Deadline: 2 December 2027</p>
        <p className="mt-2 text-xs text-navy-500">{annexIIINote}</p>
      </div>
    </div>
  );
}
