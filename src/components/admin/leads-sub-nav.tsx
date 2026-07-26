import Link from "next/link";

export function LeadsSubNav({ active, pendingCount }: { active: "all" | "pending"; pendingCount: number }) {
  const tabs = [
    { key: "all" as const, href: "/admin/leads", label: "All Leads" },
    { key: "pending" as const, href: "/admin/leads/pending", label: `Pending Review (${pendingCount})` },
  ];

  return (
    <nav className="mb-6 flex gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            tab.key === active ? "bg-navy-900 text-white" : "bg-navy-100 text-navy-600 hover:bg-navy-200"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
