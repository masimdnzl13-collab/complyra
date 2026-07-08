"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ARTISTIC_EXEMPTION_NOTE, DEEPFAKE_EXAMPLE_TEXT, PUBLIC_INTEREST_EXAMPLE_TEXT } from "@/lib/article50/content";
import type { DeepfakeArtifactType } from "@/lib/article50/types";

const TYPE_OPTIONS: { value: DeepfakeArtifactType; label: string }[] = [
  { value: "deepfake", label: "Deepfake content (imitates a real person's face or voice)" },
  { value: "public_interest_text", label: "AI-generated public-interest text (news, policy, analysis)" },
  { value: "both", label: "Both" },
];

export function DeepfakeWizard() {
  const router = useRouter();
  const [artifactType, setArtifactType] = useState<DeepfakeArtifactType | "">("");
  const [isArtisticOrSatirical, setIsArtisticOrSatirical] = useState(false);
  const [contentDescription, setContentDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!artifactType) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/article50/deepfake-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactType,
          isArtisticOrSatirical,
          publicInterestContentDescription: contentDescription || undefined,
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
      <h1 className="text-xl font-semibold text-navy-900">Deepfake & public-interest disclosure</h1>
      <p className="mt-2 text-sm text-navy-600">
        Does your company publish deepfake content, or AI-generated text on a matter of public interest?
      </p>

      <div className="mt-8 rounded-xl border border-navy-100 bg-surface p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setArtifactType(opt.value)}
              className={`block w-full rounded-md border-2 px-4 py-3 text-left text-sm font-medium ${
                artifactType === opt.value ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {(artifactType === "deepfake" || artifactType === "both") && (
          <div className="rounded-md bg-navy-50 p-4 text-sm text-navy-700">
            <p>
              Deepfake content must be disclosed as &quot;artificially generated / manipulated&quot; — even if there&apos;s no
              intent to deceive.
            </p>
            <p className="mt-2 font-mono text-xs text-navy-500">Example: &quot;{DEEPFAKE_EXAMPLE_TEXT}&quot;</p>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-navy-600">
              <input
                type="checkbox"
                className="mt-0.5 accent-accent"
                checked={isArtisticOrSatirical}
                onChange={(e) => setIsArtisticOrSatirical(e.target.checked)}
              />
              This is evidently artistic, creative, or satirical content
            </label>
            {isArtisticOrSatirical && <p className="mt-1 text-xs text-navy-500">{ARTISTIC_EXEMPTION_NOTE}</p>}
          </div>
        )}

        {(artifactType === "public_interest_text" || artifactType === "both") && (
          <div className="rounded-md bg-navy-50 p-4 text-sm text-navy-700">
            <p>
              AI-generated maps, political statements, or policy analysis must be disclosed (outside the editorial-review
              exemption).
            </p>
            <p className="mt-2 font-mono text-xs text-navy-500">Example: &quot;{PUBLIC_INTEREST_EXAMPLE_TEXT}&quot;</p>
            <label className="mt-3 block text-xs font-medium text-navy-600">
              Briefly describe the content (optional, helps tailor the text)
              <input
                className="mt-1 w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                value={contentDescription}
                onChange={(e) => setContentDescription(e.target.value)}
              />
            </label>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="button"
          disabled={!artifactType || isSubmitting}
          onClick={handleSubmit}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {isSubmitting ? "Generating…" : "Generate disclosure text"}
        </button>
      </div>
    </div>
  );
}
