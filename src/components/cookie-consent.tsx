"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";

const STORAGE_KEY = "complyra-cookie-consent";
type Consent = "unknown" | "accepted" | "declined";

/**
 * Renders nothing until mounted (localStorage isn't available during SSR),
 * same hydration-safety pattern as CountdownCard. Analytics cookies
 * (Google Analytics) only load after explicit accept — required for GDPR,
 * since Complyra is an EU-facing product built to help other companies get
 * this exact kind of thing right.
 */
export function CookieConsent({ gaMeasurementId }: { gaMeasurementId?: string }) {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setConsent(stored === "accepted" || stored === "declined" ? stored : "unknown");
  }, []);

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  }

  return (
    <>
      {consent === "accepted" && gaMeasurementId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');
            `}
          </Script>
        </>
      )}

      {consent === "unknown" && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy-100 bg-white px-6 py-4 shadow-lg">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-navy-600">
              We use strictly necessary cookies to run this site, and analytics cookies only if you accept them. See our{" "}
              <Link href="/privacy" className="font-medium text-accent hover:text-accent-600">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
