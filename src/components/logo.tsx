import Link from "next/link";
import { siteConfig } from "@/config/site";

/** Plain wordmark — no icon/monogram. Bold + tight tracking on the existing Inter face for a stronger, more assertive mark, not a new font. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-lg font-bold tracking-tight text-navy-900">
      {siteConfig.name}
    </Link>
  );
}
