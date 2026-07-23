import Link from "next/link";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-navy-100 bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-navy-600 hover:text-navy-900"
          >
            Sign in
          </Link>
          <Link
            href="/pricing"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
