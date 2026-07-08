import type {
  ContentType,
  GenerativeModelSource,
  Language,
  NoticeFormat,
  PublishPlatform,
} from "./types";

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  de: "German",
  tr: "Turkish",
  fr: "French",
  es: "Spanish",
};

export const NOTICE_FORMAT_OPTIONS: { value: NoticeFormat; label: string; compliant: boolean; note: string }[] = [
  {
    value: "text_dropdown",
    label: "Text in a collapsed/hidden menu",
    compliant: false,
    note: "Not sufficient on its own — Article 50 requires the disclosure to be clear and immediately perceivable, not tucked behind a click.",
  },
  {
    value: "text_visible",
    label: "Text always visible",
    compliant: true,
    note: "Compliant — clearly perceivable at the start of the interaction.",
  },
  {
    value: "voice_and_text",
    label: "Voice notice + text",
    compliant: true,
    note: "Compliant, and the stronger option for voice/phone systems where a visible text notice alone may not be noticed.",
  },
];

export const CONTENT_TYPE_REQUIREMENTS: Record<ContentType, string> = {
  text: "Machine-readable marking (e.g. embedded metadata) plus a human-perceptible indicator such as a visible label.",
  image: "Machine-readable watermark or metadata plus a visible icon or label indicating AI generation.",
  audio: "Machine-readable audio watermark plus a spoken or accompanying text disclosure.",
  video: "Machine-readable watermark or metadata plus a visible on-screen indicator, ideally combined with a watermark.",
};

export const PLATFORM_LABELS: Record<PublishPlatform, string> = {
  website: "Website",
  social_media: "Social media",
  news_platform: "News platform",
  other: "Other",
};

/** Platform-specific formatting notes shown before the Claude-generated label text. */
export const PLATFORM_GUIDANCE: Record<PublishPlatform, string> = {
  website:
    "On a website, a persistent visible label near the content (e.g. \"AI-generated\") plus embedded metadata is typical.",
  social_media:
    "On platforms like Instagram and TikTok, use the platform's own AI-content label feature where available, and add a short caption disclosure (e.g. \"AI-generated\" or \"Made with AI\") — captions alone, without the platform label, are not sufficient on their own.",
  news_platform:
    "News platforms should disclose prominently near the byline or headline, not only in fine print at the article's end.",
  other: "Disclose as close to the content itself as possible — avoid burying the notice in unrelated terms pages.",
};

export const MODEL_SOURCE_LABELS: Record<GenerativeModelSource, string> = {
  openai: "OpenAI",
  meta: "Meta",
  own_model: "Our own model",
  other: "Other",
};

export const MODEL_SOURCE_METADATA_NOTES: Record<GenerativeModelSource, string> = {
  openai: "OpenAI embeds C2PA metadata in images from its image-generation models — verify it's preserved through your pipeline and not stripped by resizing/re-encoding.",
  meta: "Meta applies \"AI Info\" labels and embedded markers to its generative outputs — check whether your integration passes those through unchanged.",
  own_model: "You're responsible for implementing watermarking yourself — see the C2PA standard referenced below.",
  other: "Check your vendor's documentation for what metadata or watermark standard it applies, if any.",
};

export const WATERMARK_STANDARD_NOTE =
  "There is no finalized ISO/technical standard yet, but the European Commission's Article 50 implementation " +
  "guidance points to C2PA (Coalition for Content Provenance and Authenticity) as the reference approach for " +
  "machine-readable content provenance — adopting it now is the safest bet ahead of any formal standard.";

export const DEEPFAKE_EXAMPLE_TEXT =
  "This image/audio was synthetically generated or manipulated by AI.";

export const PUBLIC_INTEREST_EXAMPLE_TEXT =
  "This analysis was AI-generated. We have reviewed its accuracy and disclaim responsibility for misuse.";

export const ARTISTIC_EXEMPTION_NOTE =
  "For evidently artistic, creative, satirical, or fictional content, a lighter-touch disclosure is accepted — " +
  "e.g. \"AI-generated, satirical\" — as long as it doesn't obscure that the work is synthetic.";
