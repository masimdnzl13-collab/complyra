import "server-only";

/** fetch() with a hard timeout via AbortController — shared by every outbound call the Lead Discovery module makes (Hunter.io, website scans). */
export function fetchWithTimeout(url: string, timeoutMs: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}
