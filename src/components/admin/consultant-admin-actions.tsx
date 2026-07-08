"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteConsultantForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const response = await fetch("/api/admin/consultants/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setStatus("sent");
      setEmail("");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-6">
      <h2 className="text-sm font-semibold text-navy-900">Invite a consultant</h2>
      <p className="mt-1 text-sm text-navy-600">Sends a profile setup link to the consultant&apos;s email.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="email"
          required
          placeholder="consultant@lawfirm.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send invite"}
        </button>
      </form>
      {status === "sent" && <p className="mt-3 text-sm text-success">Invite sent.</p>}
      {status === "error" && error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function ConsultantStatusActions({ consultantId, status }: { consultantId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/consultants/${consultantId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "pending_approval") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("approved")}
          className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("rejected")}
          className="rounded-md border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={() => setStatus("active")}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        Activate
      </button>
    );
  }

  return <span className="text-xs text-navy-400">—</span>;
}
