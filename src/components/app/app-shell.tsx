import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "./sign-out-button";

export function AppShell({
  email,
  isOwner,
  isPlatformAdmin,
  children,
}: {
  email: string;
  isOwner: boolean;
  isPlatformAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-navy-100 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-navy-900">
              {siteConfig.name}
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              <Link href="/ai-systems" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                AI Systems
              </Link>
              <Link href="/assessments" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                Risk Assessments
              </Link>
              <Link href="/documents" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                Documents
              </Link>
              <Link href="/article-50" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                Article 50
              </Link>
              <Link href="/ai-literacy" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                AI Literacy
              </Link>
              <Link href="/expert-reviews" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                Expert Reviews
              </Link>
              {isOwner && (
                <Link href="/billing" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                  Billing
                </Link>
              )}
              {isOwner && (
                <Link href="/settings" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                  Settings
                </Link>
              )}
              {isPlatformAdmin && (
                <span className="flex items-center gap-4 border-l border-navy-100 pl-6">
                  <Link href="/admin/subscriptions" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                    Subscriptions
                  </Link>
                  <Link href="/admin/consultants" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                    Consultants
                  </Link>
                  <Link href="/admin/expert-reviews" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                    Reviews
                  </Link>
                  <Link href="/admin/automations" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                    Automations
                  </Link>
                </span>
              )}
            </nav>
          </div>
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
