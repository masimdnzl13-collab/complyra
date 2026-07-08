import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export const metadata = constructMetadata({
  title: "EU AI Act for Non-EU Companies Selling to Europe",
  description: "If you sell to the EU, the AI Act applies to you — even from Turkey, the US, or anywhere else. Check your scope.",
  path: "/export-compliance",
});

const scopeCases = [
  { title: "Your product has AI built in", detail: "If a product you sell into the EU contains an AI system, the Act's obligations for providers apply to you, regardless of where you're based." },
  { title: "You deploy AI in your own operations", detail: "If your EU-facing operations use AI tools — even third-party ones — you may have deployer obligations." },
  { title: "You provide AI to EU companies", detail: "Selling or licensing an AI system to a company operating in the EU brings you into scope as a provider, wherever your business is registered." },
];

export default function ExportCompliancePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-navy-900">EU AI Act for Non-EU Companies Selling to Europe</h1>
        <p className="mt-4 text-lg text-navy-600">
          If you sell to the EU, you&apos;re subject to the Act — even from Turkey, the US, or anywhere else. Here&apos;s what determines whether it applies to you.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/risk-scan" className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-600">
            Check your scope
          </Link>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-navy-900">Why it matters outside the EU</h2>
        <p className="mt-3 text-sm text-navy-600">
          The EU AI Act has extraterritorial reach, similar to GDPR. Where your company is incorporated doesn&apos;t determine whether the Act
          applies — whether your AI system&apos;s output is used in the EU does.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {scopeCases.map((c) => (
          <div key={c.title} className="rounded-xl border border-navy-100 bg-surface p-5">
            <p className="text-sm font-semibold text-navy-900">{c.title}</p>
            <p className="mt-2 text-sm text-navy-600">{c.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-navy-100 bg-navy-50 p-6">
        <h2 className="text-sm font-semibold text-navy-900">What Complyra does for non-EU companies</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-navy-700">
          <li>A short scope check to confirm whether the Act applies to your specific product and market</li>
          <li>Risk classification against the same rules an EU-based company would use</li>
          <li>Documentation and disclosure templates ready for an EU audience</li>
        </ul>
      </div>

      <div className="mt-12 rounded-xl border border-navy-100 bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-navy-900">Get regulatory updates</p>
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
