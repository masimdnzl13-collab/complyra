"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGE_LABELS, NOTICE_FORMAT_OPTIONS } from "@/lib/article50/content";
import type { InteractionType, Language, NoticeFormat } from "@/lib/article50/types";

const INTERACTION_OPTIONS: { value: InteractionType; label: string }[] = [
  { value: "text_chat", label: "Text-based chat" },
  { value: "voice_phone", label: "Voice / phone" },
  { value: "voice_assistant", label: "Voice assistant" },
  { value: "video", label: "Video" },
];

const LANGUAGES: Language[] = ["en", "de", "tr", "fr", "es"];

export function ChatbotDisclosureWizard({ systemId, systemName }: { systemId: string; systemName: string }) {
  const router = useRouter();
  const [languages, setLanguages] = useState<Set<Language>>(new Set<Language>(["en"]));
  const [interactionType, setInteractionType] = useState<InteractionType | "">("");
  const [noticeFormat, setNoticeFormat] = useState<NoticeFormat | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleLanguage(lang: Language) {
    setLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  }

  const valid = languages.size > 0 && interactionType !== "" && noticeFormat !== "";

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/article50/chatbot-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId,
          languages: Array.from(languages),
          interactionType,
          noticeFormat,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      const data = await response.json();
      router.push(`/article-50/artifacts/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <p className="text-sm font-medium text-navy-500">Disclosure notice for</p>
      <h1 className="mt-1 text-xl font-semibold text-navy-900">{systemName}</h1>

      <div className="mt-8 rounded-xl border border-navy-100 bg-surface p-8 shadow-sm space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-navy-900">
            Which languages is this system exposed to customers in?
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  languages.has(lang) ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-navy-900">Type of direct interaction</label>
          <div className="grid grid-cols-2 gap-2">
            {INTERACTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setInteractionType(opt.value)}
                className={`rounded-md border-2 px-3 py-2 text-sm font-medium ${
                  interactionType === opt.value ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-navy-900">How should the notice be delivered?</label>
          <div className="space-y-2">
            {NOTICE_FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNoticeFormat(opt.value)}
                className={`block w-full rounded-md border-2 px-4 py-3 text-left text-sm font-medium ${
                  noticeFormat === opt.value ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                }`}
              >
                {opt.label}
                <span className={`mt-1 block text-xs font-normal ${opt.compliant ? "text-success" : "text-danger"}`}>
                  {opt.note}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="button"
          disabled={!valid || isSubmitting}
          onClick={handleSubmit}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {isSubmitting ? "Generating…" : "Generate disclosure notice"}
        </button>
      </div>
    </div>
  );
}
