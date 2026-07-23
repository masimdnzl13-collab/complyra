import { ScoreGauge } from "@/components/dashboard/score-gauge";

const previewDeadlines = [
  { label: "Art. 50(1) chatbot disclosure", status: "62 days left", live: false },
  { label: "Art. 50(2) content marking", status: "132 days left", live: false },
  { label: "Art. 4 AI literacy", status: "In force", live: true },
] as const;

/**
 * A static preview of the real authenticated dashboard (same ScoreGauge
 * component, same deadline-card language), framed like a browser window and
 * tilted slightly — gives the homepage one concrete product shot instead of
 * being all text.
 */
export function DashboardPreview() {
  return (
    <div className="mx-auto mt-14 w-full max-w-3xl [perspective:1600px]">
      <div
        className="origin-top overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-2xl shadow-navy-900/10"
        style={{ transform: "rotateX(4deg)" }}
      >
        <div className="flex items-center gap-2 border-b border-navy-100 bg-navy-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
          <div className="ml-3 flex-1 truncate rounded-md border border-navy-100 bg-white px-3 py-1 font-mono text-xs text-navy-400">
            app.vermoncy.io/dashboard
          </div>
        </div>

        <div className="grid gap-4 bg-navy-50/60 p-6 sm:grid-cols-5 sm:p-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-navy-100 bg-white p-4 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Compliance score</p>
            <div className="mt-1 h-[120px] w-[120px] origin-top scale-[0.65]">
              <ScoreGauge score={82} />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-3 sm:self-center">
            {previewDeadlines.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 bg-white px-4 py-3"
              >
                <span className="text-sm text-navy-700">{row.label}</span>
                <span
                  className={
                    row.live
                      ? "shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                      : "shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-700"
                  }
                >
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
