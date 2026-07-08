"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrgActionButton({
  orgId,
  action,
  label,
  confirmMessage,
  danger,
}: {
  orgId: string;
  action: "reset_usage" | "force_downgrade" | "cancel_subscription" | "suspend" | "unsuspend";
  label: string;
  confirmMessage?: string;
  danger?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/organizations/${orgId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-md border px-3 py-2 text-xs font-medium disabled:opacity-50 ${
        danger ? "border-danger text-danger hover:bg-danger/5" : "border-navy-200 text-navy-700 hover:bg-navy-50"
      }`}
    >
      {loading ? "Working…" : label}
    </button>
  );
}

const TEMPLATE_LABELS: Record<string, string> = {
  payment_reminder: "Payment reminder",
  usage_check_in: "Usage check-in",
  general_support: "General support",
};

export function SendSupportEmailForm({ orgId }: { orgId: string }) {
  const [template, setTemplate] = useState("payment_reminder");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/support-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, note }),
      });
      if (!response.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-navy-100 p-3">
      <select
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        className="w-full rounded-md border border-navy-100 px-2 py-1.5 text-xs text-navy-900"
      >
        {Object.entries(TEMPLATE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Optional personal note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-navy-100 px-2 py-1.5 text-xs text-navy-900"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send support email"}
      </button>
      {status === "sent" && <p className="text-xs text-success">Sent.</p>}
      {status === "error" && <p className="text-xs text-danger">Failed to send.</p>}
    </form>
  );
}
