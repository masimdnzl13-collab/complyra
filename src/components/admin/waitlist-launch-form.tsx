"use client";

import { useState } from "react";

export function WaitlistLaunchForm() {
  const [discountNote, setDiscountNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!window.confirm("Send the launch email to every subscribed waitlist email? This can't be undone.")) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/admin/waitlist-launch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setResult({ sent: data.sent, failed: data.failed });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-100 bg-surface p-6">
      <h2 className="text-sm font-semibold text-navy-900">Send launch email to waitlist</h2>
      <p className="text-xs text-navy-500">Emails every newsletter subscriber who hasn&apos;t unsubscribed.</p>
      <input
        placeholder="Optional discount note, e.g. '20% off your first month.'"
        value={discountNote}
        onChange={(e) => setDiscountNote(e.target.value)}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send launch email"}
      </button>
      {status === "sent" && result && (
        <p className="text-xs text-success">
          Sent to {result.sent} subscriber{result.sent === 1 ? "" : "s"}
          {result.failed > 0 ? ` (${result.failed} failed)` : ""}.
        </p>
      )}
      {status === "error" && <p className="text-xs text-danger">Failed to send.</p>}
    </form>
  );
}
