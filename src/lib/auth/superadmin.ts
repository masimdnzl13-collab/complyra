import "server-only";
import { getCurrentUser, type CurrentUser } from "./current-user";

/**
 * The real access-control boundary for the /admin/* superadmin panel
 * (P15) — a fixed allowlist of Firebase UIDs, not a Firestore role field.
 * Configured via env rather than literally hardcoded in source: same
 * "fixed, out-of-band-managed list" intent the spec asks for, without
 * committing a specific person's UID to version control or requiring a
 * redeploy to rotate/add an admin.
 */
export function isSuperAdminUid(uid: string): boolean {
  const allowlist = (process.env.SUPERADMIN_UIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowlist.includes(uid);
}

/** Returns the current user only if they're on the superadmin allowlist — null otherwise, same shape as getCurrentUser(). */
export async function getCurrentSuperAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) return null;
  return user;
}
