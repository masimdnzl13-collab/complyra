import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AiSystemDoc, AnnexIIICategory, DecisionPoint } from "@/lib/firestore/schema";
import { INJECTION_DEFENSE_NOTE, withTimeoutAndRetry, wrapUserInput } from "@/lib/claude/safe-call";

const AssessmentSchema = z.object({
  riskTier: z.enum(["high-risk", "limited-risk", "minimal-risk"]),
  articles: z
    .array(z.string())
    .describe("EU AI Act article and/or Annex III references that support this classification"),
  justification: z
    .string()
    .describe("A clear paragraph explaining why this risk tier applies, referencing the specific facts given"),
  confidence: z.enum(["high", "medium", "low"]),
  caveats: z
    .string()
    .describe(
      "What is borderline, uncertain, or dependent on facts not provided. Empty string if there are none."
    ),
});

export type ClaudeAssessmentResult = z.infer<typeof AssessmentSchema>;

interface EvaluateParams {
  system: AiSystemDoc;
  decisionPoint: DecisionPoint;
  annexIIICategory: AnnexIIICategory | null;
  systemDeploymentStage: string;
}

/**
 * Only called for the gray-area case — Article 5 prohibitions and Article
 * 6(3) derogations are resolved deterministically before this ever runs
 * (see the route handler), so every call here genuinely needs judgment,
 * not just data lookup.
 */
export async function evaluateWithClaude({
  system,
  decisionPoint,
  annexIIICategory,
  systemDeploymentStage,
}: EvaluateParams): Promise<ClaudeAssessmentResult> {
  const description = `
System name: ${wrapUserInput(system.name)}
Description: ${wrapUserInput(system.description)}
Company's role: ${system.role}
Vendor / built on: ${wrapUserInput(system.vendor)}
Business area: ${system.businessArea}
What it concretely does: ${wrapUserInput(system.purpose)}
Data types processed: ${system.dataTypes.join(", ") || "none recorded"}
Groups affected by its output: ${system.affectedGroups.join(", ") || "none recorded"}
Decision-making role: ${system.decisionMakingRole}
Interacts directly with people (chatbot/voice): ${system.interactsWithPeople}
Generates synthetic content: ${system.generatesSyntheticContent}
Infers emotion or behavior: ${system.infersEmotionOrBehavior}
Deployment stage: ${systemDeploymentStage}
Primary decision point selected by the user: ${decisionPoint}
Candidate Annex III category from rule-based mapping (may be none): ${annexIIICategory ?? "none"}
`.trim();

  const client = new Anthropic();
  const response = await withTimeoutAndRetry(() =>
    client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(AssessmentSchema),
      },
      system:
        "You are a EU AI Act risk-classification assistant inside Complyra, a compliance preparation tool. " +
        "This is not legal advice. Prohibited-practice and narrow-derogation cases have already been " +
        "filtered out before you're called — you are only ever classifying the remaining, genuinely " +
        "judgment-requiring case. Given a structured description of an AI system, classify it as " +
        "high-risk, limited-risk, or minimal-risk under the EU AI Act, citing the specific article(s) or " +
        "Annex III category you rely on. Be conservative: if the classification is genuinely ambiguous or " +
        "could plausibly shift with facts not given, say so explicitly in the caveats field and lower your " +
        "confidence rather than asserting false certainty." +
        INJECTION_DEFENSE_NOTE,
      messages: [{ role: "user", content: description }],
    })
  );

  if (!response.parsed_output) {
    throw new Error("Claude did not return a parseable assessment");
  }
  return response.parsed_output;
}
