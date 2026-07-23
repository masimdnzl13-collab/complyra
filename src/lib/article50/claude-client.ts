import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { LANGUAGE_LABELS, PLATFORM_GUIDANCE } from "./content";
import type { InteractionType, Language, NoticeFormat, PublishPlatform } from "./types";
import { INJECTION_DEFENSE_NOTE, withTimeoutAndRetry, wrapUserInput } from "@/lib/claude/safe-call";

function client() {
  return new Anthropic();
}

const SYSTEM_PREAMBLE =
  "You write short, plain-language EU AI Act Article 50 compliance texts for Vermoncy, a compliance " +
  "preparation tool. These texts are not legal advice, and producing them does not create a legal or " +
  "professional relationship. Be direct and specific — do not pad with caveats beyond what's asked for.";

interface ChatbotDisclosureParams {
  systemName: string;
  systemDescription: string;
  interactionType: InteractionType;
  noticeFormat: NoticeFormat;
  languages: Language[];
}

export async function generateChatbotDisclosureTexts({
  systemName,
  systemDescription,
  interactionType,
  noticeFormat,
  languages,
}: ChatbotDisclosureParams): Promise<Record<Language, string>> {
  const languageList = languages.length > 0 ? languages : (["en"] as Language[]);
  const schema = z.object(
    Object.fromEntries(
      languageList.map((lang) => [
        lang,
        z.string().describe(`The disclosure notice text in ${LANGUAGE_LABELS[lang]}`),
      ])
    )
  );

  const response = await withTimeoutAndRetry(() =>
    client().messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: zodOutputFormat(schema) },
      system:
        SYSTEM_PREAMBLE +
        " Write an Article 50(1) disclosure notice telling a user they are interacting with an AI system, " +
        "not a human — one or two sentences, delivered as a " +
        noticeFormat.replace(/_/g, " ") +
        " notice for a " +
        interactionType.replace(/_/g, " ") +
        " system. Provide it in every requested language — translate faithfully, but note this is " +
        "translation assistance, not a certified translation; the user is responsible for verifying accuracy " +
        "in each language before publishing." +
        INJECTION_DEFENSE_NOTE,
      messages: [
        {
          role: "user",
          content: `System name: ${wrapUserInput(systemName)}\nWhat it does: ${wrapUserInput(
            systemDescription
          )}\nLanguages needed: ${languageList.map((l) => LANGUAGE_LABELS[l]).join(", ")}`,
        },
      ],
    })
  );

  if (!response.parsed_output) throw new Error("Claude did not return parseable disclosure texts");
  return response.parsed_output as Record<Language, string>;
}

interface ContentLabelParams {
  platform: PublishPlatform;
  contentTypes: string[];
  companyName: string;
}

const ContentLabelSchema = z.object({
  labelText: z.string().describe("The user-facing AI-content disclosure label/caption text"),
});

export async function generateContentLabelText({ platform, contentTypes, companyName }: ContentLabelParams) {
  const response = await withTimeoutAndRetry(() =>
    client().messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: zodOutputFormat(ContentLabelSchema) },
      system:
        SYSTEM_PREAMBLE +
        ` Write an Article 50(2)-compliant, clearly user-perceptible AI-content disclosure label for a "${platform.replace(/_/g, " ")}" ` +
        "context. " +
        PLATFORM_GUIDANCE[platform] +
        " Keep it short enough to use as a caption or on-page label." +
        INJECTION_DEFENSE_NOTE,
      messages: [
        {
          role: "user",
          content: `Company: ${wrapUserInput(companyName)}\nContent types published: ${contentTypes.join(", ")}\nPlatform: ${platform}`,
        },
      ],
    })
  );

  if (!response.parsed_output) throw new Error("Claude did not return a parseable label");
  return response.parsed_output.labelText;
}

const DeepfakeTextSchema = z.object({
  text: z.string().describe("The disclosure text"),
});

interface DeepfakeTextParams {
  companyName: string;
  isArtisticOrSatirical: boolean;
}

export async function generateDeepfakeDisclosureText({ companyName, isArtisticOrSatirical }: DeepfakeTextParams) {
  const response = await withTimeoutAndRetry(() =>
    client().messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 512,
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: zodOutputFormat(DeepfakeTextSchema) },
      system:
        SYSTEM_PREAMBLE +
        " Write an Article 50(4) deepfake disclosure — one short sentence stating the image or audio is " +
        "artificially generated or manipulated." +
        (isArtisticOrSatirical
          ? " This is evidently artistic/satirical content, so a lighter-touch disclosure (e.g. noting it's AI-generated and satirical) is appropriate."
          : "") +
        INJECTION_DEFENSE_NOTE,
      messages: [{ role: "user", content: `Company: ${wrapUserInput(companyName)}` }],
    })
  );
  if (!response.parsed_output) throw new Error("Claude did not return parseable text");
  return response.parsed_output.text;
}

interface PublicInterestTextParams {
  companyName: string;
  contentDescription: string;
}

export async function generatePublicInterestDisclosureText({
  companyName,
  contentDescription,
}: PublicInterestTextParams) {
  const response = await withTimeoutAndRetry(() =>
    client().messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 512,
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: zodOutputFormat(DeepfakeTextSchema) },
      system:
        SYSTEM_PREAMBLE +
        " Write an Article 50(4) disclosure for AI-generated text published on a matter of public interest " +
        "(news, policy analysis, or similar) — one or two sentences disclosing it was AI-generated, including " +
        "a note about human review and a disclaimer of responsibility for misuse." +
        INJECTION_DEFENSE_NOTE,
      messages: [
        { role: "user", content: `Company: ${wrapUserInput(companyName)}\nContent: ${wrapUserInput(contentDescription)}` },
      ],
    })
  );
  if (!response.parsed_output) throw new Error("Claude did not return parseable text");
  return response.parsed_output.text;
}
