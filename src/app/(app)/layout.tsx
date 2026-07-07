import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppShell } from "@/components/app/app-shell";

/**
 * The authoritative session check for every page under (app) — this is
 * what src/middleware.ts's cookie-presence check is only an optimistic
 * preview of. getCurrentUser() verifies the session cookie against
 * Firebase Auth via the Admin SDK.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AppShell email={user.email}>{children}</AppShell>;
}
