import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "./sign-out-button";

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-navy-100 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-navy-900">
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-navy-600">{email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
