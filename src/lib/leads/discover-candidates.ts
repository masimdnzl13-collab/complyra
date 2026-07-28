import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { withTimeoutAndRetry } from "@/lib/claude/safe-call";
import { MAX_CANDIDATES_PER_RUN } from "./discovery-config";

const CandidateSchema = z.object({
  candidates: z.array(
    z.object({
      companyName: z.string().describe("The real, verifiable company name as found via web search"),
      websiteUrl: z.string().nullable().describe("The company's own website, if found — null if not found"),
      sourceUrl: z.string().describe("The exact URL of the search result where this company was found — mandatory"),
      note: z.string().nullable().describe("Anything relevant found alongside the company, or null"),
    })
  ),
});

export interface DiscoveredCandidate {
  companyName: string;
  websiteUrl: string | null;
  sourceUrl: string;
  note: string | null;
}

const SYSTEM_PROMPT =
  "You are researching real Turkish exporter companies for Vermoncy's sales-prospecting pipeline. You have a " +
  "web_search tool — you MUST use it to find companies; never answer from memory or training data. " +
  "List ONLY companies you actually found through a web search result just now, and for every company you must " +
  "give the exact URL of the search result or page where you found it. If you are not sure a company name is " +
  "real, or you cannot find a source URL for it, do not include it. Returning an empty list is far better than " +
  "including a single company you are not fully certain about — a fabricated company name is a serious failure, " +
  "an empty list is not. Do not include companies already well-known to you from training; only include ones " +
  "this search actually surfaced.";

/**
 * The hallucination-guarded discovery call: real web_search tool use +
 * structured JSON output, re-validated client-side against the same zod
 * schema. Any parse/validation failure or refusal returns an empty list —
 * fail safe, never fail open with an unvalidated guess.
 */
export async function discoverLeadCandidates(city: string, sector: string): Promise<DiscoveredCandidate[]> {
  const client = new Anthropic();

  let response;
  try {
    response = await withTimeoutAndRetry(
      () =>
        client.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 4096,
          tools: [{ type: "web_search_20260209", name: "web_search" }],
          output_config: {
            effort: "medium",
            format: zodOutputFormat(CandidateSchema),
          },
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content:
                `Search the web for real, currently-operating exporter companies located in ${city}, Turkey, ` +
                `in the ${sector} sector. Find up to ${MAX_CANDIDATES_PER_RUN} distinct companies. For each one, ` +
                `cite the exact URL where you found it.`,
            },
          ],
        }),
      { timeoutMs: 90_000 }
    );
  } catch (err) {
    console.error("[discoverLeadCandidates] Claude API call failed:", err instanceof Error ? err.message : err);
    return [];
  }

  if (response.stop_reason === "refusal") {
    console.error("[discoverLeadCandidates] Claude refused the request (stop_reason: refusal)");
    return [];
  }

  const usedWebSearch = response.content.some((block) => block.type === "web_search_tool_result");
  if (!usedWebSearch) {
    console.error("[discoverLeadCandidates] response contained no web_search_tool_result block — Claude did not search");
  }

  const lastTextBlock = [...response.content].reverse().find((block) => block.type === "text");
  if (!lastTextBlock || lastTextBlock.type !== "text") {
    console.error(
      "[discoverLeadCandidates] no text block in response content — block types:",
      response.content.map((b) => b.type)
    );
    return [];
  }

  try {
    const parsed = CandidateSchema.parse(JSON.parse(lastTextBlock.text));
    return parsed.candidates
      .filter((c) => c.companyName.trim().length > 0 && c.sourceUrl.trim().length > 0)
      .slice(0, MAX_CANDIDATES_PER_RUN);
  } catch (err) {
    console.error("[discoverLeadCandidates] failed to parse/validate Claude's JSON output:", err, "raw text:", lastTextBlock.text);
    return [];
  }
}
