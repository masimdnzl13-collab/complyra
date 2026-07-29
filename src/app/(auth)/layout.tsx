import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight text-navy-900">
        {siteConfig.name}
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-navy-100 bg-surface p-8 shadow-sm">
        {children}
      </div>
      <p className="mt-4 text-xs text-navy-400">
        <Link href="/privacy" className="hover:text-navy-600">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
