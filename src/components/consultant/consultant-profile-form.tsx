"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ConsultantLanguage, ConsultantTurnaround } from "@/lib/firestore/schema";

const LANGUAGE_OPTIONS: { value: ConsultantLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "tr", label: "Turkish" },
];

const TURNAROUND_OPTIONS: { value: ConsultantTurnaround; label: string }[] = [
  { value: "24h", label: "24 hours" },
  { value: "2d", label: "2 days" },
  { value: "1w", label: "1 week" },
];

export function ConsultantProfileForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState("");
  const [languages, setLanguages] = useState<ConsultantLanguage[]>(["en"]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [worksWithTurkey, setWorksWithTurkey] = useState(false);
  const [certifications, setCertifications] = useState("");
  const [references, setReferences] = useState("");
  const [averageTurnaround, setAverageTurnaround] = useState<ConsultantTurnaround>("2d");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleLanguage(lang: ConsultantLanguage) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/consultant/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          expertiseAreas: expertiseAreas.split(",").map((s) => s.trim()).filter(Boolean),
          languages,
          hourlyRate: Number(hourlyRate),
          yearsExperience: Number(yearsExperience),
          bio,
          worksWithTurkey,
          certifications: certifications.split(",").map((s) => s.trim()).filter(Boolean),
          references: references.split(",").map((s) => s.trim()).filter(Boolean),
          averageTurnaround,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.push("/consultant/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-navy-100 bg-surface p-6">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Full name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Areas of expertise</span>
        <input
          required
          placeholder="EU AI Act, GDPR, employment law"
          value={expertiseAreas}
          onChange={(e) => setExpertiseAreas(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <span className="mt-1 block text-xs text-navy-400">Comma-separated.</span>
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Languages</span>
        <div className="flex gap-4">
          {LANGUAGE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-navy-700">
              <input type="checkbox" checked={languages.includes(opt.value)} onChange={() => toggleLanguage(opt.value)} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Hourly rate (EUR)</span>
          <input
            required
            type="number"
            min={1}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Years of experience</span>
          <input
            required
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Bio</span>
        <textarea
          required
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-navy-700">
        <input type="checkbox" checked={worksWithTurkey} onChange={(e) => setWorksWithTurkey(e.target.checked)} />
        I work with clients based in Turkey
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Certifications</span>
        <input
          placeholder="CIPP/E, IAPP AIGP"
          value={certifications}
          onChange={(e) => setCertifications(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <span className="mt-1 block text-xs text-navy-400">Comma-separated, optional.</span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">References</span>
        <input
          placeholder="Client or firm names, optional"
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <span className="mt-1 block text-xs text-navy-400">Comma-separated, optional.</span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-navy-900">Typical turnaround</span>
        <select
          value={averageTurnaround}
          onChange={(e) => setAverageTurnaround(e.target.value as ConsultantTurnaround)}
          className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {TURNAROUND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || languages.length === 0}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Submit for review"}
      </button>
    </form>
  );
}
