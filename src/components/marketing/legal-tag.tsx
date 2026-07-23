import type { ReactNode } from "react";

/**
 * The small mono-font "Art. 50" style reference chip, first introduced in
 * the hero's legal-reference strip. Extracted so the same visual language
 * can repeat on feature cards, FAQ entries, etc. without drifting.
 */
export function LegalTag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-lg border border-navy-100 bg-navy-50 px-3 py-1.5 font-mono text-xs text-navy-600 ${className}`}
    >
      {children}
    </span>
  );
}
