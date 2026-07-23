import Link from "next/link";
import { siteConfig } from "@/config/site";

interface LogoProps {
  href?: string;
  /** "light" is for dark backgrounds (the ink hero) — white wordmark. "dark" (default) is for light backgrounds. */
  variant?: "dark" | "light";
}

/** Shared monogram + wordmark, used by the marketing header and the app shell so the two never drift apart. */
export function Logo({ href = "/", variant = "dark" }: LogoProps) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-warning font-display text-sm font-bold text-navy-900">
        C
      </span>
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          variant === "light" ? "text-white" : "text-navy-900"
        }`}
      >
        {siteConfig.name}
      </span>
    </Link>
  );
}
