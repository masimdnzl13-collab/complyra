"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining, type TimeRemaining } from "@/lib/countdown";

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

export function DeadlineCountdown({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const update = () => setRemaining(getTimeRemaining(targetDate));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!remaining) {
    return <span className="text-xs text-navy-400">Loading…</span>;
  }

  if (remaining.inForce) {
    return <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">Live</span>;
  }

  return (
    <span className="text-xs font-medium text-navy-500">
      {dateFormatter.format(new Date(targetDate))} · {remaining.days}d {remaining.hours}h left
    </span>
  );
}
