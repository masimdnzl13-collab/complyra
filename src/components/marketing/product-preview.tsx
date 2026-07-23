import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SAMPLE_SYSTEMS = [
  { name: "Recruitment screener", risk: "high" as const },
  { name: "Support chatbot", risk: "limited" as const },
  { name: "Internal analytics", risk: "minimal" as const },
];

const RISK_BADGE_TONE = { high: "danger", limited: "warning", minimal: "success" } as const;
const RISK_LABEL = { high: "High risk", limited: "Limited risk", minimal: "Minimal risk" } as const;

const SAMPLE_DOCUMENTS = ["Risk classification report", "Technical documentation", "Human oversight procedure"];

const SCORE = 82;
const SIZE = 88;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Static, illustrative hero visual — sample data only, not wired to any
 * real account. Assembles simplified versions of real product concepts
 * (compliance score, inventory, generated documents) rather than a live
 * dashboard, so it's decorative and marked aria-hidden.
 */
export function ProductPreview() {
  const offset = CIRCUMFERENCE * (1 - SCORE / 100);

  return (
    <Card padding="lg" className="shadow-premium" aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-navy-500">Compliance health</p>
          <p className="mt-1 text-xs text-navy-400">Updated automatically</p>
        </div>
        <div className="relative flex shrink-0 items-center justify-center" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#EEF2F8" strokeWidth={STROKE} />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#2563EB"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute text-lg font-bold text-navy-900">{SCORE}</span>
        </div>
      </div>

      <div className="mt-8 border-t border-navy-100 pt-6">
        <p className="text-sm font-medium text-navy-500">AI system inventory</p>
        <div className="mt-3 space-y-2">
          {SAMPLE_SYSTEMS.map((system) => (
            <div
              key={system.name}
              className="flex items-center justify-between rounded-xl border border-navy-100 bg-navy-50 px-4 py-3"
            >
              <span className="text-sm font-medium text-navy-900">{system.name}</span>
              <Badge tone={RISK_BADGE_TONE[system.risk]}>{RISK_LABEL[system.risk]}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-navy-100 pt-6">
        <p className="text-sm font-medium text-navy-500">Generated documents</p>
        <ul className="mt-3 space-y-2">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <li key={doc} className="flex items-center gap-2 text-sm text-navy-700">
              <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={2.5} />
              {doc}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
