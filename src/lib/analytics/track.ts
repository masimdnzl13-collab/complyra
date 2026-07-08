"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | "risk_scan_started"
  | "risk_scan_completed"
  | "signup"
  | "assessment_completed"
  | "document_generated"
  | "cta_clicked"
  | "blog_post_read";

/** No-ops safely if GA4 isn't configured (NEXT_PUBLIC_GA_MEASUREMENT_ID unset) or hasn't loaded yet. */
export function trackEvent(event: AnalyticsEvent, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}
