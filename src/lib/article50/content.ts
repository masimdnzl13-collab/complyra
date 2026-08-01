import type {
  ContentType,
  GenerativeModelSource,
  Language,
  MachineMarkingGuidance,
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

/**
 * The technically demanding half of Article 50(2) — machine-readable,
 * detectable marking of the underlying file — as opposed to the
 * human-perceptible label generated per-request by Claude. This is curated,
 * reviewed reference content (specific standard/field names like C2PA and
 * IPTC "Digital Source Type") rather than something an LLM should freehand
 * per request, so it's a static lookup by content type, not a generated
 * text. Keyed by ContentType; PLATFORM placement guidance is separate below
 * since it varies independently of content type.
 */
export const MACHINE_MARKING_GUIDANCE: Record<ContentType, Omit<MachineMarkingGuidance, "placementNote">> = {
  image: {
    contentType: "image",
    maturity: "available",
    maturityNote:
      "Mature, deployed options exist — image is the strongest-supported content type for machine-readable marking today.",
    methods: [
      {
        method: "C2PA / Content Credentials manifest",
        howTo:
          "Embed a signed C2PA manifest recording this asset as AI-generated, with the generating tool listed as an assertion. Many generation tools (e.g. Adobe Firefly, OpenAI's image models) emit this natively — verify your export/resize pipeline doesn't strip it.",
      },
      {
        method: "IPTC / XMP metadata",
        howTo:
          "Set the IPTC \"Digital Source Type\" field to algorithmicMedia (or compositeWithTrainedAlgorithmicMedia for AI-edited-but-not-fully-generated images) in the embedded XMP block — this is the field most photo/DAM/CMS tools already read.",
      },
      {
        method: "Invisible, robust watermark",
        howTo:
          "Where your generation tool offers one (e.g. Google SynthID or an equivalent from your vendor), apply an imperceptible watermark encoded into the pixel data so the mark survives ordinary recompression and resizing.",
      },
    ],
  },
  video: {
    contentType: "video",
    maturity: "available",
    maturityNote: "C2PA extends to video, though tooling support is less universal than for still images.",
    methods: [
      {
        method: "C2PA / Content Credentials manifest",
        howTo:
          "Embed a signed C2PA manifest at the container level, and re-embed it after any transcoding step in your pipeline — transcoding is the most common place this gets silently stripped.",
      },
      {
        method: "Frame or container-level watermark",
        howTo:
          "Apply a robust watermark across frames (via your generation vendor's tooling where available) so it survives standard compression (H.264/H.265) and re-encoding for different platforms.",
      },
      {
        method: "XMP metadata",
        howTo:
          "Set the same IPTC \"Digital Source Type\" field used for images in the video file's XMP block, for tools that read video metadata the same way.",
      },
    ],
  },
  audio: {
    contentType: "audio",
    maturity: "limited",
    maturityNote:
      "Acoustic watermarking exists and is improving, but is less standardized than image/video marking — treat it as current best practice, not a guaranteed-robust mark.",
    methods: [
      {
        method: "Acoustic watermark",
        howTo:
          "Embed an inaudible watermark in the audio signal using your text-to-speech/voice-generation vendor's watermarking feature, if it offers one — this should survive normal compression (MP3/AAC) reasonably well.",
      },
      {
        method: "Accompanying metadata / manifest",
        howTo:
          "Attach a C2PA manifest or ID3/XMP metadata block declaring the audio as AI-generated alongside the file, as a fallback for players/platforms that strip watermarks or don't preserve them through re-encoding.",
      },
    ],
  },
  text: {
    contentType: "text",
    maturity: "still_maturing",
    maturityNote:
      "Reliable, standardized machine-readable watermarking for plain text does not yet exist at the maturity level of image/audio/video marking — there is no widely deployed mark that survives copy-paste or reformatting. Treat the options below as best-effort until the technology (and/or AI Office guidance) matures further.",
    methods: [
      {
        method: "Embedded metadata / provenance header",
        howTo:
          "Where your publishing format supports it (a CMS custom field, document properties, or a C2PA-style manifest for structured formats), record the content as AI-generated in the metadata.",
      },
      {
        method: "Signed provenance / publishing-platform meta-tag",
        howTo:
          "If your CMS or platform supports a machine-readable content-origin field or meta tag, set it to declare AI generation — currently the closest practical equivalent to a machine-readable mark for plain text.",
      },
    ],
  },
};

/** How/where the marking should be placed, independent of content type — this is what changes based on the publish-platform selection. */
export const MACHINE_MARKING_PLATFORM_PLACEMENT: Record<PublishPlatform, string> = {
  website:
    "Embed the marking in the file itself AND add a matching page-level signal (e.g. a meta tag or structured-data field) next to the human-visible label — that way both a file re-user and a page scraper see the AI-origin signal.",
  social_media:
    "Apply the platform's own AI-content label at upload, where the platform offers one, in addition to embedding your own watermark/metadata BEFORE uploading. Most platforms strip custom XMP/IPTC metadata on upload, so the platform's native flag is often the only machine-readable signal that survives — don't rely on file-embedded metadata alone here.",
  news_platform:
    "Preserve file-embedded marking through your publishing pipeline (CMS ingestion commonly strips metadata on resize/re-encode — verify it doesn't), and mirror the AI-origin declaration in the article's structured data or byline metadata.",
  other:
    "Embed the strongest marking your tooling supports directly in the file, and mirror it in any metadata field your distribution channel is known to preserve.",
};

/** Combines the content-type guidance with the selected platform's placement note. */
export function getMachineMarkingGuidance(
  contentTypes: ContentType[],
  platform: PublishPlatform
): MachineMarkingGuidance[] {
  return contentTypes.map((contentType) => ({
    ...MACHINE_MARKING_GUIDANCE[contentType],
    placementNote: MACHINE_MARKING_PLATFORM_PLACEMENT[platform],
  }));
}

export const ARTICLE_50_2_STATE_OF_THE_ART_NOTE =
  "Article 50(2) requires marking that is effective, interoperable, robust, and reliable \"to the extent " +
  "technically feasible\" — the bar is state of the art, not a fixed checklist, and it will move as the " +
  "technology matures. The AI Office is expected to issue further implementation guidance and codes of " +
  "practice on machine-readable marking; treat the methods above as current best practice, to be revisited " +
  "as that guidance develops.";

export const MACHINE_MARKING_NOT_DETECTION_NOTE =
  "This is implementation guidance, not a detectability guarantee — applying these methods does not certify " +
  "that any given file will be reliably detected as AI-generated by every downstream tool or platform. As " +
  "with all Vermoncy output, this is not legal advice.";

export const LABEL_AND_MARKING_LINK_NOTE =
  "The label above is the human-perceptible half of Article 50(2); machine-readable marking is the other " +
  "half — both are required together, not as alternatives. This works alongside your watermark checklist " +
  "(the Article 50(2) marking obligation for your generative model/vendor), not instead of it.";
