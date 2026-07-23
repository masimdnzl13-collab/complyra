"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

const DEFAULT_CLASS_NAME = "text-sm font-medium text-navy-600 hover:text-navy-900 disabled:opacity-50";

export function SignOutButton({ className = DEFAULT_CLASS_NAME }: { className?: string }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} disabled={isSigningOut} className={className}>
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
