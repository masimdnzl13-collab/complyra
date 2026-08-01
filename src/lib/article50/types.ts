import { z } from "zod";
import type { Article50Area } from "@/lib/firestore/schema";

export type Language = "en" | "de" | "tr" | "fr" | "es";
export type InteractionType = "text_chat" | "voice_phone" | "voice_assistant" | "video";
export type NoticeFormat = "text_dropdown" | "text_visible" | "voice_and_text";

export interface ChatbotDisclosureData {
  languages: Language[];
  interactionType: InteractionType;
  noticeFormat: NoticeFormat;
  texts: Record<Language, string>;
}

export const ChatbotDisclosureDataSchema = z.object({
  languages: z.array(z.enum(["en", "de", "tr", "fr", "es"])),
  interactionType: z.enum(["text_chat", "voice_phone", "voice_assistant", "video"]),
  noticeFormat: z.enum(["text_dropdown", "text_visible", "voice_and_text"]),
  // Keyed by Language but not required to be exhaustive — only the requested
  // languages are ever generated, so a plain string-keyed record is validated here.
  texts: z.record(z.string(), z.string()),
}) satisfies z.ZodType<ChatbotDisclosureData>;

export type ContentType = "text" | "image" | "audio" | "video";
export type PublishPlatform = "website" | "social_media" | "news_platform" | "other";

/** How mature/reliable machine-readable marking is for a given content type — surfaced in the UI so text's honest limitations aren't presented with the same confidence as image/video. */
export type MachineMarkingMaturity = "available" | "limited" | "still_maturing";

export interface MachineMarkingMethod {
  method: string;
  howTo: string;
}

export interface MachineMarkingGuidance {
  contentType: ContentType;
  maturity: MachineMarkingMaturity;
  maturityNote: string;
  methods: MachineMarkingMethod[];
  /** Where/how to apply the marking for the artifact's selected publish platform. */
  placementNote: string;
}

export interface ContentLabelingData {
  contentTypes: ContentType[];
  platform: PublishPlatform;
  labelText: string;
  checklist: { id: string; label: string; checked: boolean }[];
  /**
   * Optional (not required) so artifacts generated before this field existed
   * still parse — see ContentLabelingView's fallback when this is absent.
   */
  machineMarkingGuidance?: MachineMarkingGuidance[];
}

const MachineMarkingGuidanceSchema = z.object({
  contentType: z.enum(["text", "image", "audio", "video"]),
  maturity: z.enum(["available", "limited", "still_maturing"]),
  maturityNote: z.string(),
  methods: z.array(z.object({ method: z.string(), howTo: z.string() })),
  placementNote: z.string(),
}) satisfies z.ZodType<MachineMarkingGuidance>;

export const ContentLabelingDataSchema = z.object({
  contentTypes: z.array(z.enum(["text", "image", "audio", "video"])),
  platform: z.enum(["website", "social_media", "news_platform", "other"]),
  labelText: z.string(),
  checklist: z.array(z.object({ id: z.string(), label: z.string(), checked: z.boolean() })),
  machineMarkingGuidance: z.array(MachineMarkingGuidanceSchema).optional(),
}) satisfies z.ZodType<ContentLabelingData>;

export type GenerativeModelSource = "openai" | "meta" | "own_model" | "other";
export type WatermarkCapability = "yes" | "partial" | "no";

export interface WatermarkChecklistData {
  modelSource: GenerativeModelSource;
  watermarkCapability: WatermarkCapability;
  vendorCommitmentDocumented: boolean;
  standardSelected: boolean;
  outputFilesVerified: boolean;
}

export const WatermarkChecklistDataSchema = z.object({
  modelSource: z.enum(["openai", "meta", "own_model", "other"]),
  watermarkCapability: z.enum(["yes", "partial", "no"]),
  vendorCommitmentDocumented: z.boolean(),
  standardSelected: z.boolean(),
  outputFilesVerified: z.boolean(),
}) satisfies z.ZodType<WatermarkChecklistData>;

export type DeepfakeArtifactType = "deepfake" | "public_interest_text" | "both";

export interface DeepfakeDisclosureData {
  artifactType: DeepfakeArtifactType;
  isArtisticOrSatirical: boolean;
  deepfakeText: string | null;
  publicInterestText: string | null;
}

export const DeepfakeDisclosureDataSchema = z.object({
  artifactType: z.enum(["deepfake", "public_interest_text", "both"]),
  isArtisticOrSatirical: z.boolean(),
  deepfakeText: z.string().nullable(),
  publicInterestText: z.string().nullable(),
}) satisfies z.ZodType<DeepfakeDisclosureData>;

/** Maps each Article50Area to the zod schema that validates its `Article50Artifact.data`. */
export const ARTICLE50_DATA_SCHEMAS = {
  chatbot_disclosure: ChatbotDisclosureDataSchema,
  content_labeling: ContentLabelingDataSchema,
  watermark_checklist: WatermarkChecklistDataSchema,
  deepfake_disclosure: DeepfakeDisclosureDataSchema,
} satisfies Record<Article50Area, z.ZodType>;
