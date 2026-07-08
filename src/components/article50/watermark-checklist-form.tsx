"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MODEL_SOURCE_LABELS, MODEL_SOURCE_METADATA_NOTES, WATERMARK_STANDARD_NOTE } from "@/lib/article50/content";
import type { GenerativeModelSource, WatermarkCapability, WatermarkChecklistData } from "@/lib/article50/types";
import { DeadlineCountdown } from "./deadline-countdown";

const MODEL_SOURCES: GenerativeModelSource[] = ["openai", "meta", "own_model", "other"];
const CAPABILITIES: { value: WatermarkCapability; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "partial", label: "Partially" },
  { value: "no", label: "No" },
];

interface WatermarkChecklistFormProps {
  watermarkDeadline: string;
  existing: (WatermarkChecklistData & { id: string; status: "draft" | "reviewed" }) | null;
}

export function WatermarkChecklistForm({ watermarkDeadline, existing }: WatermarkChecklistFormProps) {
  const router = useRouter();
  const [modelSource, setModelSource] = useState<GenerativeModelSource>(existing?.modelSource ?? "openai");
  const [watermarkCapability, setWatermarkCapability] = useState<WatermarkCapability>(existing?.watermarkCapability ?? "no");
  const [vendorCommitmentDocumented, setVendorCommitmentDocumented] = useState(existing?.vendorCommitmentDocumented ?? false);
  const [standardSelected, setStandardSelected] = useState(existing?.standardSelected ?? false);
  const [outputFilesVerified, setOutputFilesVerified] = useState(existing?.outputFilesVerified ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/article50/watermark-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSource,
          watermarkCapability,
          vendorCommitmentDocumented,
          standardSelected,
          outputFilesVerified,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Machine-readable watermark checklist</h1>
        <DeadlineCountdown targetDate={watermarkDeadline} />
      </div>
      <p className="mt-2 text-navy-600">
        Article 50(2) requires machine-readable marking of AI-generated audio, image, and video content.
      </p>

      <div className="mt-8 space-y-6 rounded-xl border border-navy-100 bg-surface p-8 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-navy-900">
            Where does your generative model come from?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MODEL_SOURCES.map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => setModelSource(source)}
                className={`rounded-md border-2 px-3 py-2 text-sm font-medium ${
                  modelSource === source ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                }`}
              >
                {MODEL_SOURCE_LABELS[source]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-navy-500">{MODEL_SOURCE_METADATA_NOTES[modelSource]}</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-navy-900">Does your system have watermarking capability?</label>
          <div className="flex gap-2">
            {CAPABILITIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setWatermarkCapability(c.value)}
                className={`flex-1 rounded-md border-2 px-3 py-2 text-sm font-medium ${
                  watermarkCapability === c.value ? "border-accent bg-accent-50 text-navy-900" : "border-navy-100 text-navy-600"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <Checkbox
          checked={vendorCommitmentDocumented}
          onChange={setVendorCommitmentDocumented}
          label="If using a third-party tool, is the vendor's Article 50 watermarking commitment documented?"
        />
        <div>
          <Checkbox checked={standardSelected} onChange={setStandardSelected} label="Has a watermark standard been selected?" />
          <p className="ml-7 mt-1 text-xs text-navy-500">{WATERMARK_STANDARD_NOTE}</p>
        </div>
        <Checkbox
          checked={outputFilesVerified}
          onChange={setOutputFilesVerified}
          label="Have output files been tested and confirmed to carry the watermark?"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save checklist"}
          </button>
          {existing && (
            <a
              href={`/api/article50/${existing.id}/pdf`}
              className="rounded-md border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50"
            >
              Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-navy-800">
      <input type="checkbox" className="mt-0.5 accent-accent" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
