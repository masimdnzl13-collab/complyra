import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";

const SeoSchema = z.object({
  primaryKeywordCount: z.number().describe("How many times the primary keyword (or a close natural variant) appears in the text"),
  relatedKeywords: z.array(z.string()).describe("3-6 related/LSI keywords this post should also touch on, based on its current content"),
  suggestions: z.array(z.string()).describe("2-4 short, concrete SEO improvement suggestions for this specific draft"),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const { content, primaryKeyword } = await request.json().catch(() => ({}));
  if (typeof content !== "string" || !content.trim() || typeof primaryKeyword !== "string" || !primaryKeyword.trim()) {
    return NextResponse.json({ error: "Provide both content and a primary keyword" }, { status: 400 });
  }

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(SeoSchema),
    },
    system:
      "You are an SEO assistant for Complyra's blog, which targets SME business owners researching EU AI Act " +
      "compliance. Given a draft post's Markdown content and its intended primary keyword, count real occurrences " +
      "of the keyword (including close natural variants), suggest related/LSI keywords actually relevant to what " +
      "this specific draft covers, and give concrete, specific improvement suggestions — not generic SEO advice.",
    messages: [
      {
        role: "user",
        content: `Primary keyword: "${primaryKeyword}"\n\nDraft content:\n${content.slice(0, 8000)}`,
      },
    ],
  });

  if (!response.parsed_output) {
    return NextResponse.json({ error: "Claude did not return a parseable result" }, { status: 502 });
  }

  return NextResponse.json(response.parsed_output);
}
