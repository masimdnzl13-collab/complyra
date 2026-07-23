import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { regulationDeadlines } from "@/config/site";
import { getTimeRemaining } from "@/lib/countdown";
import { CountdownCard } from "@/components/marketing/countdown-card";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export const metadata = constructMetadata({
  title: "Article 50 Transparency Compliance",
  description:
    "Your chatbot must disclose itself to users starting August 2026. Generate disclosure notices, labeling templates, and deadline tracking with Vermoncy.",
  path: "/article-50-compliance",
});

export const revalidate = 60;

const transparencyDeadline = regulationDeadlines.find((d) => d.id === "transparency")!;

const painPoints = [
  {
    title: "Your chatbot has to say it's a bot",
    description: "Article 50(1) requires AI systems that interact directly with people to disclose that fact — no more silent chatbots.",
  },
  {
    title: "AI-generated content needs a label",
    description: "Synthetic text, image, audio, and video output aimed at the public must be marked as AI-generated.",
  },
  {
    title: "The deadline doesn't move",
    description: "August 2, 2026 is fixed in the regulation. Waiting until the week before means scrambling.",
  },
];

export default function Article50CompliancePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Article 50 Transparency Compliance</h1>
        <p className="mt-4 text-lg text-navy-600">
          Your chatbot must disclose itself to users. Deadlines, requirements, and ready-to-use templates — all inside Vermoncy.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/risk-scan" className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-600">
            Start Article 50 prep free
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <CountdownCard deadline={transparencyDeadline} initialRemaining={getTimeRemaining(transparencyDeadline.date)} />
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {painPoints.map((p) => (
          <div key={p.title} className="rounded-xl border border-navy-100 bg-surface p-5">
            <p className="text-sm font-semibold text-navy-900">{p.title}</p>
            <p className="mt-2 text-sm text-navy-600">{p.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-navy-100 bg-navy-50 p-6">
        <h2 className="text-lg font-semibold text-navy-900">What Vermoncy generates for you</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-navy-700">
          <li>Chatbot and voice-assistant disclosure notices, matched to how your system actually interacts with people</li>
          <li>Content-labeling templates for AI-generated text, image, audio, and video</li>
          <li>A watermarking readiness checklist ahead of the December 2026 deadline</li>
          <li>Deadline tracking that emails you at 30 and 7 days out</li>
        </ul>
      </div>

      <div className="mt-8 text-center text-sm text-navy-500">Used by SaaS companies preparing for the August 2026 deadline.</div>

      <div className="mt-12 rounded-xl border border-navy-100 bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-navy-900">Get regulatory updates</p>
        <p className="mt-1 text-sm text-navy-600">A short email when something in the Act actually changes.</p>
        <div className="mt-4 flex justify-center">
          <NewsletterForm />
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-navy-400">
        This is a documentation preparation tool, not legal advice. Consult a qualified professional for advice on your specific obligations.
      </p>
    </div>
  );
}
