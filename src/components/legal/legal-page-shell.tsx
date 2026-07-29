import type { ReactNode } from "react";

/**
 * Shared shell for the long-form legal/trust pages (Legal Notice, Privacy
 * Policy, Security, Terms). Width is capped for readable line length; the
 * prose classes reuse the site's existing navy/accent type system rather
 * than inventing new styling.
 */
export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-navy-900">{title}</h1>
      <p className="mt-2 text-sm text-navy-500">Last updated: {lastUpdated}</p>

      <div className="prose mt-10 max-w-none space-y-6 text-navy-700 prose-headings:text-navy-900 prose-a:text-accent">
        {children}
      </div>
    </div>
  );
}
