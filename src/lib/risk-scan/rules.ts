import { regulationDeadlines } from "@/config/site";
import type { EmployeeCountRange } from "@/lib/firestore/schema";
import type {
  AiRoleAnswer,
  EuRelationAnswer,
  Finding,
  ScanAnswers,
  ScanResult,
  UseCase,
} from "./types";

const EU_RELATIONS = new Set<EuRelationAnswer>(["based", "sells", "neither"]);
const AI_ROLES = new Set<AiRoleAnswer>(["provider", "deployer", "both"]);
const USE_CASES = new Set<UseCase>([
  "hiring",
  "credit_insurance",
  "education",
  "chatbot",
  "content_generation",
  "biometric",
  "emotion_monitoring",
  "none",
]);
const EMPLOYEE_RANGES = new Set<EmployeeCountRange>([
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
]);

/**
 * Validates untrusted request bodies for both risk-scan API routes. When
 * euRelation is "neither" the rest of the wizard was never shown to the
 * visitor, so the remaining fields are allowed to be absent — the rules
 * engine ignores them on that branch anyway.
 */
export function isValidScanAnswers(body: unknown): body is ScanAnswers {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  if (typeof b.euRelation !== "string" || !EU_RELATIONS.has(b.euRelation as EuRelationAnswer)) {
    return false;
  }
  if (b.euRelation === "neither") return true;

  if (typeof b.aiRole !== "string" || !AI_ROLES.has(b.aiRole as AiRoleAnswer)) return false;
  if (
    !Array.isArray(b.useCases) ||
    !b.useCases.every((u) => typeof u === "string" && USE_CASES.has(u as UseCase))
  ) {
    return false;
  }
  if (typeof b.vulnerableAudience !== "boolean") return false;
  if (
    typeof b.companySize !== "string" ||
    !EMPLOYEE_RANGES.has(b.companySize as EmployeeCountRange)
  ) {
    return false;
  }
  return true;
}

// Article 4 (AI literacy) and Article 5 (prohibited practices) have been in
// force since the Act's first application date — well before the P4
// countdown cards, which only track the three still-upcoming deadlines.
const ARTICLE_4_IN_FORCE_DATE = "2025-02-02T00:00:00Z";
const ARTICLE_5_IN_FORCE_DATE = "2025-02-02T00:00:00Z";

/** Total distinct obligation/prohibition areas this scanner checks against — drives the "X of N" summary. */
const TOTAL_OBLIGATION_AREAS = 8;

function deadline(id: "transparency" | "watermarking" | "high-risk") {
  const found = regulationDeadlines.find((d) => d.id === id);
  if (!found) throw new Error(`Missing regulation deadline: ${id}`);
  return found;
}

function isInForce(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

const HIGH_RISK_USE_CASES: { case: UseCase; title: string; annex: string; description: string }[] = [
  {
    case: "hiring",
    title: "Likely high-risk: recruitment & worker management",
    annex: "Annex III(4)",
    description:
      "AI used to screen candidates or evaluate employees falls under the high-risk category for employment and worker management.",
  },
  {
    case: "credit_insurance",
    title: "Likely high-risk: credit & insurance decisions",
    annex: "Annex III(5)",
    description:
      "AI used to assess creditworthiness or price and underwrite insurance falls under the high-risk category for access to essential private services.",
  },
  {
    case: "education",
    title: "Likely high-risk: education & exam evaluation",
    annex: "Annex III(3)",
    description:
      "AI used to evaluate students, score exams, or determine access to education or training falls under the high-risk category for education.",
  },
  {
    case: "biometric",
    title: "Likely high-risk: biometric identification",
    annex: "Annex III(1)",
    description:
      "Facial recognition or other biometric identification or categorization systems fall under the high-risk category for biometrics.",
  },
];

/**
 * Deterministic, rule-based — no AI call. Keeps the free scanner free of
 * both inference cost and non-determinism; the same answers always produce
 * the same findings, which matters once a report link is emailed out and
 * expected to stay accurate.
 */
export function evaluateRiskScan(answers: ScanAnswers): ScanResult {
  if (answers.euRelation === "neither") {
    return {
      earlyExit: true,
      earlyExitMessage:
        "The EU AI Act doesn't appear to apply to your company today — it applies once you're established in the EU, or you place AI systems on the EU market. Worth rechecking if that changes.",
      findings: [],
      totalAreas: TOTAL_OBLIGATION_AREAS,
      matchedAreas: 0,
    };
  }

  const findings: Finding[] = [];
  const useCases = new Set(answers.useCases);

  findings.push({
    id: "ai-literacy",
    title: "AI literacy obligation",
    severity: "info",
    legalReference: "Article 4",
    effectiveDate: ARTICLE_4_IN_FORCE_DATE,
    inForce: true,
    description:
      "Staff involved in operating or overseeing your AI systems must have a sufficient level of AI literacy. This applies to every organization using AI, regardless of risk tier.",
    nextStep: "Track completed AI literacy training for the relevant staff.",
  });

  for (const item of HIGH_RISK_USE_CASES) {
    if (!useCases.has(item.case)) continue;
    const d = deadline("high-risk");
    findings.push({
      id: `high-risk-${item.case}`,
      title: item.title,
      severity: "high",
      legalReference: `${item.annex}, Articles 8–15`,
      effectiveDate: d.date,
      inForce: isInForce(d.date),
      description: item.description,
      nextStep: "Classify this system formally and prepare its technical documentation ahead of the deadline.",
    });
  }

  if (useCases.has("chatbot")) {
    const d = deadline("transparency");
    findings.push({
      id: "transparency-chatbot",
      title: "Transparency notice required",
      severity: "transparency",
      legalReference: "Article 50(1)",
      effectiveDate: d.date,
      inForce: isInForce(d.date),
      description:
        "People interacting with your chatbot or voice assistant must be told they're talking to an AI system, unless it's obvious from context.",
      nextStep: "Add a clear AI-disclosure notice to the chatbot or voice assistant interface.",
    });
  }

  if (useCases.has("content_generation")) {
    const d = deadline("watermarking");
    findings.push({
      id: "transparency-content",
      title: "Machine-readable marking required",
      severity: "transparency",
      legalReference: "Article 50(2)",
      effectiveDate: d.date,
      inForce: isInForce(d.date),
      description:
        "Synthetic text, image, audio, or video your systems generate must carry a machine-readable mark identifying it as AI-generated.",
      nextStep: "Implement machine-readable marking in your content-generation pipeline.",
    });
  }

  if (useCases.has("emotion_monitoring")) {
    findings.push({
      id: "prohibited-emotion",
      title: "Prohibited practice: workplace emotion recognition",
      severity: "prohibited",
      legalReference: "Article 5",
      effectiveDate: ARTICLE_5_IN_FORCE_DATE,
      inForce: true,
      description:
        "Using AI to infer the emotions or behavior of employees in the workplace is a prohibited practice under the EU AI Act, with only narrow medical/safety exceptions.",
      nextStep: "Stop this use case, or confirm with legal counsel that it falls within a narrow exception — this isn't a documentation gap, it's a ban.",
    });
  }

  return {
    earlyExit: false,
    profile: { role: answers.aiRole },
    findings,
    totalAreas: TOTAL_OBLIGATION_AREAS,
    matchedAreas: findings.length,
  };
}
