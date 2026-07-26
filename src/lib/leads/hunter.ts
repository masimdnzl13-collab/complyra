import "server-only";
import type { LeadEmailContact } from "@/lib/firestore/schema";
import { fetchWithTimeout } from "./fetch-with-timeout";

const HUNTER_BASE_URL = "https://api.hunter.io/v2";
const FETCH_TIMEOUT_MS = 15_000;

export type HunterErrorReason = "missing_api_key" | "quota_exceeded" | "rate_limited" | "invalid_domain" | "unknown";

export interface HunterDomainSearchResult {
  emails: LeadEmailContact[];
  pattern: string | null;
}

export type HunterSearchOutcome =
  | { ok: true; result: HunterDomainSearchResult }
  | { ok: false; reason: HunterErrorReason; message: string };

export interface HunterAccountStatus {
  available: number;
  used: number;
}

/** Strips protocol, `www.`, path/query from a website URL down to a bare domain. Returns null if the input isn't a usable URL. */
export function extractDomain(websiteUrl: string): string | null {
  try {
    const withProtocol = /^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;
    const host = new URL(withProtocol).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

interface HunterApiEmail {
  value: string;
  type: "personal" | "generic";
  confidence: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
}

interface HunterDomainSearchData {
  pattern: string | null;
  emails: HunterApiEmail[];
}

/**
 * Pure mapping from Hunter's Domain Search payload to our schema — no
 * fabricated addresses: `type: "personal"` (a named individual Hunter found)
 * maps to "verified", `type: "generic"` (info@, contact@, ...) to
 * "generic_corporate". Hunter's `pattern` is stored as an informational
 * template string only, never used to synthesize a specific address.
 */
export function mapHunterDomainSearchToEmails(data: HunterDomainSearchData): HunterDomainSearchResult {
  const emails: LeadEmailContact[] = data.emails.map((e) => ({
    address: e.value,
    confidence: e.type === "personal" ? "verified" : "generic_corporate",
    name: e.first_name && e.last_name ? `${e.first_name} ${e.last_name}` : e.first_name || e.last_name || null,
    position: e.position || null,
    confidenceScore: typeof e.confidence === "number" ? e.confidence : null,
  }));
  return { emails, pattern: data.pattern || null };
}

function classifyErrorStatus(status: number): HunterErrorReason {
  if (status === 429) return "rate_limited";
  if (status === 403) return "quota_exceeded";
  if (status === 400 || status === 422) return "invalid_domain";
  return "unknown";
}

/** Calls Hunter.io's Domain Search endpoint. Never throws — quota/rate-limit/invalid-domain errors come back as a friendly `{ok: false, message}` instead of an unhandled exception. */
export async function searchDomainEmails(domain: string): Promise<HunterSearchOutcome> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key", message: "Hunter.io API key is not configured." };
  }

  try {
    const url = `${HUNTER_BASE_URL}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(apiKey)}`;
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const reason = classifyErrorStatus(response.status);
      const detail = body?.errors?.[0]?.details || body?.errors?.[0]?.id;
      const message =
        reason === "quota_exceeded"
          ? "This month's Hunter.io search allowance has been used up."
          : reason === "rate_limited"
            ? "Hunter.io is rate-limiting requests right now — try again shortly."
            : detail || "Hunter.io could not process this domain.";
      return { ok: false, reason, message };
    }

    const data = body?.data as HunterDomainSearchData | undefined;
    if (!data) {
      return { ok: false, reason: "unknown", message: "Hunter.io returned an unexpected response." };
    }
    return { ok: true, result: mapHunterDomainSearchToEmails(data) };
  } catch {
    return { ok: false, reason: "unknown", message: "Could not reach Hunter.io — please try again." };
  }
}

/** Live remaining-search count from Hunter's own account endpoint — no local counter needed, Hunter tracks the monthly cycle. Returns null on any failure. */
export async function getHunterAccountStatus(): Promise<HunterAccountStatus | null> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetchWithTimeout(`${HUNTER_BASE_URL}/account?api_key=${encodeURIComponent(apiKey)}`, FETCH_TIMEOUT_MS);
    if (!response.ok) return null;
    const body = await response.json().catch(() => null);
    const searches = body?.data?.requests?.searches;
    if (!searches || typeof searches.available !== "number" || typeof searches.used !== "number") return null;
    return { available: searches.available, used: searches.used };
  } catch {
    return null;
  }
}
