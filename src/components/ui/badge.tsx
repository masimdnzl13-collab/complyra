import type { ComponentPropsWithoutRef } from "react";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-navy-100 text-navy-600",
  accent: "bg-accent/10 text-accent-700",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  tone?: BadgeTone;
}

/**
 * Shared status-pill primitive. Not yet rolled out to the existing
 * STATUS_STYLES call sites (dashboard checklist, ai-systems, admin
 * organizations) — that's follow-up table/list work; built now so it's
 * ready when that lands.
 */
export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  );
}
