"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteBlogPostButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm("Delete this post permanently?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/blog/${slug}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className="text-xs font-medium text-danger hover:opacity-80 disabled:opacity-50">
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
