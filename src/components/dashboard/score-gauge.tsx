import { brandColors } from "@/config/site";

const SIZE = 180;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function colorForScore(score: number): { stroke: string; text: string } {
  if (score < 40) return { stroke: brandColors.danger.DEFAULT, text: "text-danger" };
  if (score < 70) return { stroke: brandColors.warning.DEFAULT, text: "text-warning" };
  return { stroke: brandColors.success.DEFAULT, text: "text-success" };
}

export function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const { stroke, text } = colorForScore(clamped);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={brandColors.navy[50]} strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${text}`}>{clamped}</span>
        <span className="text-xs font-medium text-navy-400">/ 100</span>
      </div>
    </div>
  );
}
