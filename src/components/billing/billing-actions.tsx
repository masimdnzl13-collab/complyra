"use client";

import { useEffect, useState } from "react";
import type { PlanId } from "@/config/site";

async function postJson(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

export function PlanCheckoutButton({
  planId,
  interval,
  label,
  disabled,
}: {
  planId: PlanId;
  interval: "month" | "year";
  label: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await postJson("/api/billing/checkout", { planId, interval });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function CancelSubscriptionButton() {
  const [status, setStatus] = useState<"idle" | "confirming" | "cancelling" | "cancelled" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setStatus("cancelling");
    setError(null);
    try {
      await postJson("/api/billing/cancel");
      setStatus("cancelled");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "cancelled") {
    return <p className="text-sm text-navy-600">Your subscription will end at the close of the current billing period.</p>;
  }

  if (status === "confirming" || status === "cancelling") {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-navy-700">Cancel your subscription? You&apos;ll keep access until the period ends.</p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={status === "cancelling"}
          className="shrink-0 rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {status === "cancelling" ? "Cancelling…" : "Confirm cancel"}
        </button>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          disabled={status === "cancelling"}
          className="shrink-0 text-xs font-medium text-navy-500 hover:text-navy-900 disabled:opacity-50"
        >
          Never mind
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setStatus("confirming")}
        className="text-sm font-medium text-danger hover:opacity-80"
      >
        Cancel subscription
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function ManagePaymentMethodButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/portal");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50"
      >
        {loading ? "Loading…" : "Manage payment method"}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

interface Invoice {
  id: string;
  total: string;
  status: string;
  createdAt: string;
  url: string;
}

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data.invoices ?? []))
      .catch(() => setError("Couldn't load invoice history."));
  }, []);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (invoices === null) return <p className="text-sm text-navy-500">Loading…</p>;
  if (invoices.length === 0) return <p className="text-sm text-navy-500">No invoices yet.</p>;

  return (
    <ul className="space-y-2">
      {invoices.map((inv) => (
        <li key={inv.id} className="flex items-center justify-between rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm">
          <div>
            <span className="font-medium text-navy-900">{inv.total}</span>
            <span className="ml-2 text-xs text-navy-500">{new Date(inv.createdAt).toLocaleDateString()}</span>
            <span className="ml-2 text-xs capitalize text-navy-400">{inv.status}</span>
          </div>
          <a href={inv.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:text-accent-600">
            View
          </a>
        </li>
      ))}
    </ul>
  );
}
