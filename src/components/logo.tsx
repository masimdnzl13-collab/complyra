import Link from "next/link";
import { Check } from "lucide-react";
import { siteConfig } from "@/config/site";

interface LogoProps {
  /** "dark" (default) is for light backgrounds — navy wordmark. "light" is for dark backgrounds (the footer) — white wordmark. */
  variant?: "dark" | "light";
  href?: string;
}

/** Shared wordmark + icon mark, used by the marketing header and footer so the two never drift apart. */
export function Logo({ variant = "dark", href = "/" }: LogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent">
        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
      </span>
      <span
        className={`text-lg font-bold tracking-tight ${variant === "light" ? "text-white" : "text-navy-900"}`}
      >
        {siteConfig.name}
      </span>
    </Link>
  );
}
