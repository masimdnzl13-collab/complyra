"use client";

import { useState } from "react";

export function ProposalActions({ reviewId }: { reviewId: string }) {
  const [status, setStatus] = useState<"idle" | "accepting" | "declining" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setStatus("accepting");
    setError(null);
    try {
      const response = await fetch(`/api/expert-reviews/${reviewId}/accept-proposal`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleDecline() {
    setStatus("declining");
    setError(null);
    try {
      const response = await fetch(`/api/expert-reviews/${reviewId}/decline-proposal`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={status === "accepting" || status === "declining"}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {status === "accepting" ? "Redirecting…" : "Accept & pay"}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={status === "accepting" || status === "declining"}
          className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50"
        >
          {status === "declining" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function RatingForm({ reviewId }: { reviewId: string }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const response = await fetch(`/api/expert-reviews/${reviewId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "sent") {
    return <p className="text-sm text-success">Thanks for your feedback.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            className={`text-2xl leading-none ${n <= stars ? "text-warning" : "text-navy-200"}`}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {status === "sending" ? "Submitting…" : "Submit rating"}
      </button>
    </form>
  );
}
