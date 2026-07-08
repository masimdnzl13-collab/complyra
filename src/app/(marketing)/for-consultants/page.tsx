import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig } from "@/config/site";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export const metadata = constructMetadata({
  title: "White-Label AI Act Compliance for Your Clients",
  description: "Serve your SME clients with pre-made EU AI Act compliance templates, risk assessments, and review tools.",
  path: "/for-consultants",
});

const steps = [
  { title: "Your clients sign up", detail: "They build their AI system inventory and generate their own risk classifications and documents inside Complyra." },
  { title: "You review and advise", detail: "Borderline or high-stakes cases route to Complyra's expert review network, where you can weigh in with paid, structured proposals." },
  { title: "Everyone stays in sync", detail: "Documents, assessments, and audit trails live in one place — no email attachments to track." },
];

export default function ForConsultantsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-navy-900">White-Label AI Act Compliance for Your Clients</h1>
        <p className="mt-4 text-lg text-navy-600">
          Serve your SME clients with pre-made compliance templates and assessments — without building the tooling yourself.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a
            href={`mailto:${siteConfig.contact.email}?subject=Partner%20with%20Complyra`}
            className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-600"
          >
            Partner with us
          </a>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-navy-900">How it works</h2>
        <div className="mt-4 space-y-4">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-4 rounded-xl border border-navy-100 bg-surface p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-navy-900">{s.title}</p>
                <p className="mt-1 text-sm text-navy-600">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-dashed border-navy-200 bg-navy-50 p-6 text-center">
        <p className="text-sm font-semibold text-navy-900">Partner program</p>
        <p className="mt-1 text-sm text-navy-600">Revenue-share and white-label details are coming soon — reach out and we&apos;ll loop you in first.</p>
      </div>

      <div className="mt-12 rounded-xl border border-navy-100 bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-navy-900">Get regulatory updates</p>
        <div className="mt-4 flex justify-center">
          <NewsletterForm />
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-navy-400">
        This is a documentation preparation tool, not legal advice. Consult a qualified professional for advice on specific obligations.
      </p>
    </div>
  );
}
