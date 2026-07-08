export interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  inForce: boolean;
}

/**
 * Pure — no Date.now() side effects hidden inside a component — so it can
 * be called identically on server and client. Callers are responsible for
 * only invoking it after mount when the result is meant to reflect "now"
 * (see CountdownCard), which is what keeps this hydration-safe.
 */
export function getTimeRemaining(targetIso: string, now: number = Date.now()): TimeRemaining {
  const totalMs = Math.max(new Date(targetIso).getTime() - now, 0);

  return {
    totalMs,
    days: Math.floor(totalMs / (1000 * 60 * 60 * 24)),
    hours: Math.floor((totalMs / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((totalMs / (1000 * 60)) % 60),
    seconds: Math.floor((totalMs / 1000) % 60),
    inForce: totalMs <= 0,
  };
}
