import Link from "next/link";
import { siteConfig } from "@/config/site";

/**
 * Plain wordmark — no icon/monogram. Bold + tight tracking on the existing
 * Inter face for a stronger, more assertive mark, not a new font.
 *
 * `prefetch` defaults to Link's own default (eager) since the marketing "/"
 * target is static and cheap to prefetch. The (app) shell passes `false`
 * here — this wordmark is always visible in the header there, and its
 * target (/dashboard) is the heaviest per-user page in the app (multiple
 * parallel Firestore reads), so eager-prefetching it on every single page
 * view would multiply backend load for no benefit.
 */
export function Logo({ href = "/", prefetch }: { href?: string; prefetch?: boolean }) {
  return (
    <Link href={href} prefetch={prefetch} className="text-lg font-bold tracking-tight text-navy-900">
      {siteConfig.name}
    </Link>
  );
}
