"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("checking");
    setError(null);
    try {
      const response = await fetch("/api/admin/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Incorrect password");
        setStatus("error");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong — please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-24 text-center">
      <h1 className="text-xl font-semibold text-navy-900">Admin access</h1>
      <p className="mt-2 text-sm text-navy-600">Enter the admin panel password to continue.</p>
      <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm"
          placeholder="Password"
        />
        <button
          type="submit"
          disabled={status === "checking" || !password}
          className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "checking" ? "Checking…" : "Continue"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </div>
  );
}
