import Link from "next/link";
import { Logo } from "@/components/logo";
import type { OrgRole } from "@/lib/firestore/schema";
import { AppNav } from "./app-nav";
import { AccountMenu } from "./account-menu";

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  member: "Member",
  platform_admin: "Platform Admin",
};

export function AppShell({
  email,
  isOwner,
  isPlatformAdmin,
  organizationName,
  role,
  children,
}: {
  email: string;
  isOwner: boolean;
  isPlatformAdmin: boolean;
  /** From organizations/{orgId}.companyName — undefined while the user is mid-onboarding (no org yet). */
  organizationName?: string;
  role?: OrgRole;
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/ai-systems", label: "AI Systems" },
    { href: "/assessments", label: "Risk Assessments" },
    { href: "/documents", label: "Documents" },
    { href: "/article-50", label: "Article 50" },
    { href: "/ai-literacy", label: "AI Literacy" },
    { href: "/expert-reviews", label: "Expert Reviews" },
    ...(isOwner ? [{ href: "/billing", label: "Billing" }] : []),
  ];

  // Falls back to the email's local part if the org record has no name yet (mid-onboarding).
  const displayName = organizationName || email.split("@")[0];

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-navy-100 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Logo href="/dashboard" />
            <AppNav items={navItems} />
            {isPlatformAdmin && (
              <Link
                href="/admin"
                className="border-l border-navy-100 pl-6 text-sm font-medium text-navy-500 hover:text-navy-900"
              >
                Admin
              </Link>
            )}
          </div>
          <AccountMenu
            displayName={displayName}
            email={email}
            roleLabel={role ? ROLE_LABELS[role] : null}
            showSettings={isOwner}
          />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
