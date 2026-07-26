/**
 * Central config for the AI-usage scoring engine — weights and keyword
 * lists live here, not inline in scoring.ts, so tuning the model never
 * means touching the scanning code itself.
 */
export const SCORING_WEIGHTS = {
  /** AB/export signal cap. */
  exportSignals: 40,
  /** AI-usage signal cap (chatbot widget + AI-related copy). */
  aiSignals: 40,
  /** Company-maturity signal cap (career page, tenure, certifications). */
  maturitySignals: 20,
  /** Points awarded per distinct export keyword hit, up to exportSignals. */
  pointsPerExportKeyword: 10,
  /** Points for a detected chatbot widget. */
  chatbotWidgetPoints: 20,
  /** Points for AI-related keywords found in page copy. */
  aiKeywordPoints: 20,
  /** Points for having a reachable career page. */
  activeCareerPagePoints: 8,
  /** Points for a company that states 10+ years of operating history. */
  longTenurePoints: 8,
  /** Points for mentioning ISO/quality certifications. */
  certificationPoints: 4,
} as const;

/** Minimum years mentioned on the site for the "long tenure" maturity signal. */
export const MIN_TENURE_YEARS = 10;

/** AB/export-market signals — Germany/EU market presence, EU regulatory frameworks. */
export const EXPORT_KEYWORDS = [
  "germany",
  "deutschland",
  "european union",
  "avrupa birliği",
  "reach",
  "rohs",
  " ce ",
  "ce belgesi",
  "eudr",
  "cbam",
  "ihracat",
  "export",
  "exporter",
];

/** AI-usage signals in copy (career pages, product pages). */
export const AI_KEYWORDS = [
  "yapay zeka",
  "artificial intelligence",
  " ai ",
  "chatbot",
  "makine öğrenmesi",
  "machine learning",
  "otomasyon",
];

/** Company-maturity certification/quality-system signals. */
export const MATURITY_CERT_KEYWORDS = ["iso 9001", "iso 14001", "iso ", "sertifika", "certified", "kalite belgesi"];

/** Script-src / domain fingerprints for common chatbot widgets. */
export const CHATBOT_WIDGET_FINGERPRINTS = [
  "widget.intercom.io",
  "js.driftt.com",
  "embed.tawk.to",
  "client.crisp.chat",
  "zdassets.com",
  "js.hs-scripts.com",
  "tidio.co",
  "livechatinc.com",
  "chatbot",
];

/** Common career-page path guesses to probe alongside the homepage. */
export const CAREER_PAGE_PATHS = ["/career", "/careers", "/kariyer", "/jobs", "/insan-kaynaklari"];
