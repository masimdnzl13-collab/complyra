"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS, getModulesForRole } from "@/lib/ai-literacy/modules";
import type { EmployeeRole } from "@/lib/firestore/schema";

const ROLES: EmployeeRole[] = ["technical", "hr", "business", "executive", "general", "other"];

export function RoleSelector() {
  const router = useRouter();
  const [role, setRole] = useState<EmployeeRole | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!role) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/ai-literacy/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      const firstModule = getModulesForRole(role)[0];
      router.push(`/ai-literacy/modules/${firstModule.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-semibold text-navy-900">Which best describes your role?</h1>
      <p className="mt-2 text-sm text-navy-600">This shapes which extra module you&apos;ll take after the five common ones.</p>

      <div className="mt-8 space-y-2">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`block w-full rounded-md border-2 px-4 py-3 text-left text-sm font-medium ${
              role === r ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600 hover:bg-navy-50"
            }`}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <button
        type="button"
        disabled={!role || isSubmitting}
        onClick={handleSubmit}
        className="mt-8 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {isSubmitting ? "Starting…" : "Start training"}
      </button>
    </div>
  );
}
