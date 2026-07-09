"use client";

import { useEffect } from "react";
import { siteConfig } from "@/config/site";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-danger">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold text-navy-900">We hit an unexpected error</h1>
      <p className="mt-2 text-navy-600">
        Try again, or contact us at{" "}
        <a href={`mailto:${siteConfig.contact.supportEmail}`} className="text-accent hover:text-accent-600">
          {siteConfig.contact.supportEmail}
        </a>{" "}
        if it keeps happening.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
      >
        Try again
      </button>
    </div>
  );
}
