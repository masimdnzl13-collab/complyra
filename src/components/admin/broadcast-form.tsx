"use client";

import { useState } from "react";
import { pricingPlans } from "@/config/site";

export function BroadcastForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!window.confirm(`Send this announcement to ${audience === "all" ? "every organization" : `all ${audience} plan orgs`}?`)) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, audience }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setResult({ sent: data.sent, failed: data.failed });
      setStatus("sent");
      setTitle("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-100 bg-surface p-6">
      <h2 className="text-sm font-semibold text-navy-900">Send announcement</h2>
      <input
        required
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
      />
      <textarea
        required
        placeholder="Message"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
      />
      <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900">
        <option value="all">All organizations</option>
        {pricingPlans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} plan only
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send announcement"}
      </button>
      {status === "sent" && result && (
        <p className="text-xs text-success">
          Sent to {result.sent} organization{result.sent === 1 ? "" : "s"}
          {result.failed > 0 ? ` (${result.failed} failed)` : ""}.
        </p>
      )}
      {status === "error" && <p className="text-xs text-danger">Failed to send.</p>}
    </form>
  );
}
