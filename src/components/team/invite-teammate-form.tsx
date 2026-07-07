"use client";

import { useState } from "react";

export function InviteTeammateForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const response = await fetch("/api/team/invite", {
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
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-surface p-6">
      <h2 className="text-sm font-semibold text-navy-900">Invite a teammate</h2>
      <p className="mt-1 text-sm text-navy-600">
        Send an invite link that adds them to your organization as a member.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="email"
          required
          placeholder="teammate@company.com"
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
