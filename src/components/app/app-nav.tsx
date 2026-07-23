"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

/** Left-side app nav with active-route highlighting — needs usePathname(), so it's the one client piece of an otherwise server-rendered AppShell. */
export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {items.map((item) => {
        const active = pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-navy-100 text-navy-900" : "text-navy-500 hover:bg-navy-50 hover:text-navy-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
