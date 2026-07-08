import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { FeedItem } from "./rss";

const SummarySchema = z.object({
  items: z.array(
    z.object({
      title: z.string().describe("A short, clear headline — may lightly rephrase the source title for clarity"),
      summary: z
        .string()
        .describe("1-2 sentence, actionable summary written for an SME business owner, not a lawyer"),
      category: z
        .enum(["transparency", "high_risk", "prohibited", "general"])
        .describe("Which part of the EU AI Act this update mainly concerns"),
    })
  ),
});

export interface SummarizedUpdate {
  sourceTitle: string;
  title: string;
  summary: string;
  category: "transparency" | "high_risk" | "prohibited" | "general";
  sourceUrl: string;
}

/** Batches every new feed item into a single Claude call rather than one call per item. */
export async function summarizeRegulatoryUpdates(items: FeedItem[]): Promise<SummarizedUpdate[]> {
  if (items.length === 0) return [];

  const listing = items
    .map((item, i) => `${i + 1}. Title: ${item.title}\n   Description: ${item.description}`)
    .join("\n\n");

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(SummarySchema),
    },
    system:
      "You summarize EU AI Act regulatory news for Complyra, a compliance preparation tool used by SME business " +
      "owners who are not lawyers. For each item given, write a concise, actionable 1-2 sentence summary and " +
      "classify which part of the Act it mainly concerns. Return exactly one summary per item, in the same order.",
    messages: [{ role: "user", content: `Summarize these ${items.length} AI Act regulatory updates:\n\n${listing}` }],
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return parseable summaries");
  }

  return response.parsed_output.items.map((summarized, i) => ({
    sourceTitle: items[i].title,
    title: summarized.title,
    summary: summarized.summary,
    category: summarized.category,
    sourceUrl: items[i].link,
  }));
}
