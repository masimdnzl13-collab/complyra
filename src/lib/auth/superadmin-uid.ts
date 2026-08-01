import "server-only";

/**
 * The real access-control boundary for the /admin/* superadmin panel (P15)
 * and for the billing bypass rule in src/lib/billing/effective-plan.ts — a
 * fixed allowlist of Firebase UIDs, not a Firestore role field. Configured
 * via env rather than literally hardcoded in source: same "fixed,
 * out-of-band-managed list" intent as a hardcoded list, without committing
 * a specific person's UID to version control or requiring a redeploy to
 * rotate/add an admin.
 *
 * Kept in its own module, separate from getCurrentSuperAdmin() in
 * ./superadmin.ts (which needs getCurrentUser() and React's cache()), so
 * pure callers — effective-plan.ts, and anything unit-testing it outside
 * Next's runtime — can import just this function without pulling in a
 * React-Server-Components-only dependency that throws outside Next.
 */
export function isSuperAdminUid(uid: string): boolean {
  const allowlist = (process.env.SUPERADMIN_UIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowlist.includes(uid);
}
