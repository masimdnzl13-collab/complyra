import "server-only";
import { getCurrentUser, type CurrentUser } from "./current-user";
import { isSuperAdminUid } from "./superadmin-uid";

export { isSuperAdminUid };

/** Returns the current user only if they're on the superadmin allowlist — null otherwise, same shape as getCurrentUser(). */
export async function getCurrentSuperAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) return null;
  return user;
}
