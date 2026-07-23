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
      <span className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-navy-300">
        {label}
      </span>
    </div>
  );
}

/**
 * `initialRemaining` is computed on the server (see page.tsx) at request/
 * revalidation time and used as the initial state here, so the very first
 * paint already shows real days/hours/minutes — never a "loading" placeholder.
 * The client's first render uses that same value (no hydration mismatch),
 * then a 1s interval takes over with the client's own clock after mount.
 */
export function CountdownCard({
  deadline,
  initialRemaining,
}: {
  deadline: RegulationDeadline;
  initialRemaining: TimeRemaining;
}) {
  const [remaining, setRemaining] = useState<TimeRemaining>(initialRemaining);

  useEffect(() => {
    const update = () => setRemaining(getTimeRemaining(deadline.date));
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline.date]);

  const inForce = remaining.inForce;

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
        {!inForce ? (
          <>
            <TimeUnit value={remaining.days} label="Days" />
            <TimeUnit value={remaining.hours} label="Hours" />
            <TimeUnit value={remaining.minutes} label="Min" />
            <TimeUnit value={remaining.seconds} label="Sec" />
          </>
        ) : (
          <div className="col-span-4 rounded-lg bg-navy-50 px-2 py-3 text-center text-sm font-medium text-navy-500">
            This obligation is now in effect.
          </div>
        )}
      </div>

      <p className="mt-4 font-mono text-xs text-navy-400">{deadline.legalReference} · EU AI Act</p>
    </div>
  );
}
