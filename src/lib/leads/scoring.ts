import "server-only";
import { fetchWithTimeout } from "./fetch-with-timeout";
import {
  AI_KEYWORDS,
  CAREER_PAGE_PATHS,
  CHATBOT_WIDGET_FINGERPRINTS,
  EXPORT_KEYWORDS,
  MATURITY_CERT_KEYWORDS,
  MIN_TENURE_YEARS,
  SCORING_WEIGHTS,
} from "./scoring-config";

const FETCH_TIMEOUT_MS = 10_000;

export interface ScoringResult {
  score: number;
  rationale: string[];
}

export interface ScannedPage {
  url: string;
  html: string;
  text: string;
}

/**
 * Minimal `User-agent: *` / `Disallow` robots.txt check — pragmatic
 * root-path compliance, not a full RFC 9309 parser (we only need to know
 * whether scanning the site at all is disallowed).
 */
export function isPathAllowedByRobots(robotsTxt: string, path: string): boolean {
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.trim());
  let inWildcardGroup = false;
  const disallowRules: string[] = [];

  for (const line of lines) {
    if (/^#/.test(line) || line === "") continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      inWildcardGroup = value === "*";
    } else if (key === "disallow" && inWildcardGroup) {
      disallowRules.push(value);
    }
  }

  return !disallowRules.some((rule) => rule !== "" && path.startsWith(rule));
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function countDistinctMatches(text: string, keywords: string[]): string[] {
  return keywords.filter((kw) => text.includes(kw.toLowerCase()));
}

function detectLongTenure(text: string): boolean {
  const currentYear = new Date().getFullYear();
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g) ?? [];
  return yearMatches.some((y) => currentYear - parseInt(y, 10) >= MIN_TENURE_YEARS && currentYear - parseInt(y, 10) < 100);
}

/**
 * Pure scoring core — takes already-fetched page content and computes the
 * 0-100 AI-usage score with a human-readable rationale. Weights and keyword
 * lists come from scoring-config.ts, never hardcoded here.
 */
export function computeAiUsageScore(pages: ScannedPage[], careerPageFound: boolean): ScoringResult {
  const rationale: string[] = [];
  const combinedText = pages.map((p) => p.text).join(" ");
  const combinedHtml = pages.map((p) => p.html).join(" ");

  // Export signals
  const exportHits = countDistinctMatches(combinedText, EXPORT_KEYWORDS);
  const exportPoints = Math.min(exportHits.length * SCORING_WEIGHTS.pointsPerExportKeyword, SCORING_WEIGHTS.exportSignals);
  if (exportHits.length > 0) {
    rationale.push(`Export/EU market signals found: ${exportHits.map((k) => k.trim()).join(", ")}.`);
  }

  // AI-usage signals
  let aiPoints = 0;
  const chatbotDetected = CHATBOT_WIDGET_FINGERPRINTS.some((fp) => combinedHtml.toLowerCase().includes(fp));
  if (chatbotDetected) {
    aiPoints += SCORING_WEIGHTS.chatbotWidgetPoints;
    rationale.push("Chatbot widget detected on the site.");
  }
  const aiKeywordHits = countDistinctMatches(combinedText, AI_KEYWORDS);
  if (aiKeywordHits.length > 0) {
    aiPoints += SCORING_WEIGHTS.aiKeywordPoints;
    rationale.push(`AI-related copy found: ${aiKeywordHits.map((k) => k.trim()).join(", ")}.`);
  }
  aiPoints = Math.min(aiPoints, SCORING_WEIGHTS.aiSignals);

  // Maturity signals
  let maturityPoints = 0;
  if (careerPageFound) {
    maturityPoints += SCORING_WEIGHTS.activeCareerPagePoints;
    rationale.push("Active careers/jobs page found.");
  }
  if (detectLongTenure(combinedText)) {
    maturityPoints += SCORING_WEIGHTS.longTenurePoints;
    rationale.push(`Site indicates ${MIN_TENURE_YEARS}+ years of operating history.`);
  }
  const certHits = countDistinctMatches(combinedText, MATURITY_CERT_KEYWORDS);
  if (certHits.length > 0) {
    maturityPoints += SCORING_WEIGHTS.certificationPoints;
    rationale.push("ISO/quality certification mentioned.");
  }
  maturityPoints = Math.min(maturityPoints, SCORING_WEIGHTS.maturitySignals);

  const score = Math.min(exportPoints + aiPoints + maturityPoints, 100);
  if (rationale.length === 0) rationale.push("No export, AI-usage, or maturity signals found on the scanned pages.");

  return { score, rationale };
}

async function tryFetchPage(url: string): Promise<ScannedPage | null> {
  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const html = await res.text();
    return { url, html, text: stripHtmlTags(html) };
  } catch {
    return null;
  }
}

/**
 * Full website scan: checks robots.txt first (fails open — no robots.txt
 * means allowed), fetches the homepage plus a few common career-page path
 * guesses, then scores via computeAiUsageScore.
 */
export async function scoreLeadWebsite(websiteUrl: string): Promise<ScoringResult | { blocked: true }> {
  const origin = (() => {
    try {
      return new URL(/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`).origin;
    } catch {
      return null;
    }
  })();
  if (!origin) return { score: 0, rationale: ["Website URL could not be parsed."] };

  let robotsAllowed = true;
  try {
    const robotsRes = await fetchWithTimeout(`${origin}/robots.txt`, FETCH_TIMEOUT_MS);
    if (robotsRes.ok) {
      robotsAllowed = isPathAllowedByRobots(await robotsRes.text(), "/");
    }
  } catch {
    // No robots.txt reachable — default allow, per standard robots convention.
  }
  if (!robotsAllowed) return { blocked: true };

  const homepage = await tryFetchPage(origin);
  const pages: ScannedPage[] = homepage ? [homepage] : [];

  let careerPageFound = false;
  for (const path of CAREER_PAGE_PATHS) {
    const page = await tryFetchPage(`${origin}${path}`);
    if (page) {
      pages.push(page);
      careerPageFound = true;
      break;
    }
  }

  if (pages.length === 0) return { score: 0, rationale: ["Website could not be reached."] };
  return computeAiUsageScore(pages, careerPageFound);
}
