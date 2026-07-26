import { NextResponse } from "next/server";
import { getCurrentSuperAdmin } from "@/lib/auth/superadmin";
import { getHunterAccountStatus } from "@/lib/leads/hunter";

export async function GET() {
  const admin = await getCurrentSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const status = await getHunterAccountStatus();
  return NextResponse.json({ status });
}
