"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining, type TimeRemaining } from "@/lib/countdown";
import type { RegulationDeadline } from "@/config/site";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-navy-900 px-2 py-3 text-white">
      <span className="text-2xl font-semibold tabular-nums sm:text-3xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-navy-300">
        {label}
      </span>
    </div>
  );
}

/**
 * Renders `null` (no remaining/inForce state) until mounted, so the server
 * render and the very first client render match exactly — the live
 * countdown only starts ticking after hydration, which is what keeps this
 * free of hydration-mismatch warnings.
 */
export function CountdownCard({ deadline }: { deadline: RegulationDeadline }) {
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const update = () => setRemaining(getTimeRemaining(deadline.date));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline.date]);

  const inForce = remaining?.inForce ?? false;

  return (
    <div className="flex flex-col rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-navy-900">{deadline.title}</h3>
        {inForce ? (
          <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            In force
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-700">
            {dateFormatter.format(new Date(deadline.date))}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-navy-600">{deadline.description}</p>

      <div className="mt-5 grid grid-cols-4 gap-2" aria-live="polite">
        {remaining && !inForce ? (
          <>
            <TimeUnit value={remaining.days} label="Days" />
            <TimeUnit value={remaining.hours} label="Hours" />
            <TimeUnit value={remaining.minutes} label="Min" />
            <TimeUnit value={remaining.seconds} label="Sec" />
          </>
        ) : (
          <div className="col-span-4 rounded-lg bg-navy-50 px-2 py-3 text-center text-sm font-medium text-navy-500">
            {inForce ? "This obligation is now in effect." : "Loading countdown…"}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-navy-400">{deadline.legalReference} · EU AI Act</p>
    </div>
  );
}
