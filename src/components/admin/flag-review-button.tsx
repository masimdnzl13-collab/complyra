"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FlagReviewButton({ reviewId, flagged }: { reviewId: string; flagged: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/admin/expert-reviews/${reviewId}/flag`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
        flagged ? "bg-danger text-white hover:opacity-90" : "border border-navy-200 text-navy-700 hover:bg-navy-50"
      }`}
    >
      {flagged ? "Unflag" : "Flag"}
    </button>
  );
}
