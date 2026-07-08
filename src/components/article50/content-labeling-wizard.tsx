"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTENT_TYPE_REQUIREMENTS, PLATFORM_GUIDANCE, PLATFORM_LABELS } from "@/lib/article50/content";
import type { ContentType, PublishPlatform } from "@/lib/article50/types";

const CONTENT_TYPES: ContentType[] = ["text", "image", "audio", "video"];
const PLATFORMS: PublishPlatform[] = ["website", "social_media", "news_platform", "other"];

export function ContentLabelingWizard() {
  const router = useRouter();
  const [contentTypes, setContentTypes] = useState<Set<ContentType>>(new Set());
  const [platform, setPlatform] = useState<PublishPlatform | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(type: ContentType) {
    setContentTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const valid = contentTypes.size > 0 && platform !== "";

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/article50/content-labeling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentTypes: Array.from(contentTypes), platform }),
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
      <h1 className="text-xl font-semibold text-navy-900">AI-generated content labeling</h1>
      <p className="mt-2 text-sm text-navy-600">
        Does your product publish AI-generated or manipulated text, images, audio, or video?
      </p>

      <div className="mt-8 rounded-xl border border-navy-100 bg-surface p-8 shadow-sm space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-navy-900">Content types</label>
          <div className="space-y-2">
            {CONTENT_TYPES.map((type) => (
              <label
                key={type}
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 text-sm ${
                  contentTypes.has(type) ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                }`}
              >
                <input type="checkbox" className="mt-0.5 accent-accent" checked={contentTypes.has(type)} onChange={() => toggle(type)} />
                <span>
                  <span className="block font-medium capitalize text-navy-900">{type}</span>
                  <span className="block text-xs text-navy-500">{CONTENT_TYPE_REQUIREMENTS[type]}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-navy-900">Where is it published?</label>
          <div className="space-y-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`block w-full rounded-md border-2 px-4 py-3 text-left text-sm font-medium ${
                  platform === p ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                }`}
              >
                {PLATFORM_LABELS[p]}
                {platform === p && <span className="mt-1 block text-xs font-normal text-navy-500">{PLATFORM_GUIDANCE[p]}</span>}
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
          {isSubmitting ? "Generating…" : "Generate labeling template"}
        </button>
      </div>
    </div>
  );
}
