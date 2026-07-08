"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics/track";

export function TrackedCtaLink({
  href,
  label,
  className,
  ctaId,
}: {
  href: string;
  label: string;
  className: string;
  ctaId: string;
}) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent("cta_clicked", { cta: ctaId })}>
      {label}
    </Link>
  );
}
