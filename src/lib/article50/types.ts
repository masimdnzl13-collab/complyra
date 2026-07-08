export type Language = "en" | "de" | "tr" | "fr" | "es";
export type InteractionType = "text_chat" | "voice_phone" | "voice_assistant" | "video";
export type NoticeFormat = "text_dropdown" | "text_visible" | "voice_and_text";

export interface ChatbotDisclosureData {
  languages: Language[];
  interactionType: InteractionType;
  noticeFormat: NoticeFormat;
  texts: Record<Language, string>;
}

export type ContentType = "text" | "image" | "audio" | "video";
export type PublishPlatform = "website" | "social_media" | "news_platform" | "other";

export interface ContentLabelingData {
  contentTypes: ContentType[];
  platform: PublishPlatform;
  labelText: string;
  checklist: { id: string; label: string; checked: boolean }[];
}

export type GenerativeModelSource = "openai" | "meta" | "own_model" | "other";
export type WatermarkCapability = "yes" | "partial" | "no";

export interface WatermarkChecklistData {
  modelSource: GenerativeModelSource;
  watermarkCapability: WatermarkCapability;
  vendorCommitmentDocumented: boolean;
  standardSelected: boolean;
  outputFilesVerified: boolean;
}

export type DeepfakeArtifactType = "deepfake" | "public_interest_text" | "both";

export interface DeepfakeDisclosureData {
  artifactType: DeepfakeArtifactType;
  isArtisticOrSatirical: boolean;
  deepfakeText: string | null;
  publicInterestText: string | null;
}
