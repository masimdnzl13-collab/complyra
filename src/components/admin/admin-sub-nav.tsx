import Link from "next/link";

const SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/consultants", label: "Consultants" },
  { href: "/admin/expert-reviews", label: "Expert Reviews" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/automations", label: "System Health" },
];

export function AdminSubNav({ active }: { active: string }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-navy-100 pb-4">
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            section.href === active ? "bg-accent text-white" : "bg-navy-100 text-navy-600 hover:bg-navy-200"
          }`}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
