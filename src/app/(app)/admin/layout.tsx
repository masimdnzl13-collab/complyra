import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { ADMIN_GATE_COOKIE_NAME, verifyAdminGateToken } from "@/lib/auth/admin-gate";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths } from "@/lib/firestore/schema";
import { AdminPasswordGate } from "@/components/admin/admin-password-gate";

/**
 * Canonical server-side gate for every /admin/* page — consolidates what
 * used to be a getCurrentUser() + isSuperAdminUid() check duplicated in
 * each page.tsx. API routes under /api/admin/** aren't covered by a layout,
 * so they keep their own independent getCurrentSuperAdmin() checks.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isSuperAdminUid(user.uid)) {
    if (user.userDoc) {
      await getAdminFirestore()
        .collection(firestorePaths.auditLog(user.userDoc.organizationId))
        .add({
          actorId: user.uid,
          action: "unauthorized_access_attempt",
          targetCollection: "admin",
          targetId: "panel",
          timestamp: FieldValue.serverTimestamp(),
        });
    }
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">403 — Forbidden</h1>
        <p className="mt-2 text-navy-600">This page is only available to the platform superadmin.</p>
      </div>
    );
  }

  const cookieStore = await cookies();
  const gateToken = cookieStore.get(ADMIN_GATE_COOKIE_NAME)?.value;
  if (!verifyAdminGateToken(gateToken, user.uid)) {
    return <AdminPasswordGate />;
  }

  return <>{children}</>;
}
