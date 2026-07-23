import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

/** Shared "nothing here yet" panel for (app) list pages — see ai-systems/documents pages for the pattern this replaces. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mt-10 rounded-xl border border-navy-100 bg-navy-50 p-10 text-center">
      {Icon && <Icon className="mx-auto h-8 w-8 text-navy-300" strokeWidth={1.5} />}
      <h2 className={`text-lg font-semibold text-navy-900 ${Icon ? "mt-3" : ""}`}>{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-navy-600">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
