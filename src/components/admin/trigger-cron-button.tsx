"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CronJobName } from "@/lib/firestore/schema";

export function TriggerCronButton({ jobName }: { jobName: CronJobName }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");

  async function handleClick() {
    setStatus("running");
    try {
      const response = await fetch(`/api/cron/${jobName}`);
      if (!response.ok) throw new Error();
      setStatus("done");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "running"}
      className="rounded-md border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50"
    >
      {status === "running" ? "Running…" : status === "done" ? "Done" : status === "error" ? "Failed — retry" : "Run now"}
    </button>
  );
}
