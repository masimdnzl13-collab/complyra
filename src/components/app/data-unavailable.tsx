import { AlertTriangle } from "lucide-react";

interface DataUnavailableProps {
  title?: string;
  description?: string;
}

/** Shared fallback for (app) list/detail pages when a Firestore read throws — a single failed query renders this instead of crashing the whole page. Sibling to EmptyState (which is for "no data yet", not "couldn't load"). */
export function DataUnavailable({
  title = "Temporarily unavailable",
  description = "We couldn't load this page's data just now. Refresh in a moment — this usually clears up on retry.",
}: DataUnavailableProps) {
  return (
    <div className="mt-10 rounded-xl border border-navy-100 bg-navy-50 p-10 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-warning" strokeWidth={1.5} />
      <h2 className="mt-3 text-lg font-semibold text-navy-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-navy-600">{description}</p>
    </div>
  );
}
