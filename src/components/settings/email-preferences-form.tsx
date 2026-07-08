"use client";

import { useState } from "react";
import type { OrganizationEmailPreferences } from "@/lib/firestore/schema";

const LABELS: { key: keyof OrganizationEmailPreferences; label: string; description: string }[] = [
  {
    key: "notificationsEnabled",
    label: "Email notifications",
    description: "Master switch — turning this off silences every category below.",
  },
  {
    key: "deadlineReminders",
    label: "Deadline reminders",
    description: "Article 50, watermarking, and high-risk obligation reminders.",
  },
  {
    key: "renewalReminders",
    label: "Renewal & trial reminders",
    description: "Billing renewal and trial-ending notices.",
  },
  {
    key: "regulatoryNews",
    label: "Regulatory news",
    description: "Occasional emails about major AI Act developments.",
  },
];

export function EmailPreferencesForm({ initialPreferences }: { initialPreferences: OrganizationEmailPreferences }) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function toggle(key: keyof OrganizationEmailPreferences) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setStatus("saving");
    try {
      const response = await fetch("/api/organization/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error();
      setStatus("saved");
    } catch {
      setStatus("error");
      setPreferences(preferences);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-navy-100 bg-surface p-6">
      {LABELS.map((item) => (
        <label key={item.key} className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-medium text-navy-900">{item.label}</span>
            <span className="block text-xs text-navy-500">{item.description}</span>
          </span>
          <input
            type="checkbox"
            checked={preferences[item.key]}
            disabled={item.key !== "notificationsEnabled" && !preferences.notificationsEnabled}
            onChange={() => toggle(item.key)}
            className="mt-1 h-4 w-4 shrink-0"
          />
        </label>
      ))}
      {status === "saved" && <p className="text-xs text-success">Saved.</p>}
      {status === "error" && <p className="text-xs text-danger">Couldn&apos;t save — please try again.</p>}
    </div>
  );
}
