import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AiSystemDoc, AssessmentDoc } from "@/lib/firestore/schema";
import type { DocumentTemplate } from "./templates";
import { INJECTION_DEFENSE_NOTE, withTimeoutAndRetry, wrapUserInput } from "@/lib/claude/safe-call";

interface GenerateParams {
  template: DocumentTemplate;
  system: AiSystemDoc;
  assessment: AssessmentDoc;
  companyName: string;
}

/**
 * One Claude call fills every section of a document at once — cheaper and
 * more coherent than one call per section, and it's what "combine each
 * section into the document" in the spec actually calls for.
 */
export async function generateDocumentSections({
  template,
  system,
  assessment,
  companyName,
}: GenerateParams): Promise<Record<string, string>> {
  const sectionSchema = z.object(
    Object.fromEntries(
      template.sections.map((s) => [s.id, z.string().describe(`Content for the "${s.title}" section. ${s.guidance}`)])
    )
  );

  const context = `
Company: ${wrapUserInput(companyName)}
System name: ${wrapUserInput(system.name)}
System description: ${wrapUserInput(system.description)}
What it does: ${wrapUserInput(system.purpose)}
Company's role: ${system.role}
Vendor / built on: ${wrapUserInput(system.vendor)}
Data types: ${system.dataTypes.join(", ") || "none recorded"}
Affected groups: ${system.affectedGroups.join(", ") || "none recorded"}
Decision-making role: ${system.decisionMakingRole}

Risk classification: ${assessment.riskTier}
Legal basis: ${assessment.legalArticleReference}
Classification justification: ${wrapUserInput(assessment.justification)}
Decision point assessed: ${assessment.decisionPoint}
`.trim();

  const sectionList = template.sections.map((s) => `- ${s.title}: ${s.guidance}`).join("\n");

  const client = new Anthropic();
  const response = await withTimeoutAndRetry(() =>
    client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(sectionSchema),
      },
      system:
        `You are drafting a "${template.label}" document for Vermoncy, an EU AI Act compliance ` +
        "preparation tool. This document is not legal advice, and generating it does not create a legal " +
        "or professional relationship — do not claim otherwise anywhere in the text. Write each section " +
        "professionally and specifically to the system described, not generically. Base every claim on " +
        "the facts given; do not invent details about the system, the company, or the law that aren't " +
        "supported by the context provided.\n\nSections to write:\n" +
        sectionList +
        INJECTION_DEFENSE_NOTE,
      messages: [{ role: "user", content: context }],
    })
  );

  if (!response.parsed_output) {
    throw new Error("Claude did not return parseable document sections");
  }
  return response.parsed_output as Record<string, string>;
}
