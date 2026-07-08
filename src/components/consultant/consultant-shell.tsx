import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "@/components/app/sign-out-button";

export function ConsultantShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-navy-100 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/consultant/dashboard" className="text-lg font-semibold tracking-tight text-navy-900">
              {siteConfig.name}
              <span className="ml-2 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-500">
                Consultant Portal
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-navy-600">{name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
