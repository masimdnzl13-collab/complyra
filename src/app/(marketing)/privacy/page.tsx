import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig, legalConfig } from "@/config/site";

export const metadata = constructMetadata({
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses, and protects personal data.`,
  path: "/privacy",
});

const LAST_UPDATED = "2026-07-09";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-navy-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose mt-10 max-w-none space-y-6 text-navy-700 prose-headings:text-navy-900 prose-a:text-accent">
        <section>
          <h2 className="text-xl font-semibold text-navy-900">1. Who we are</h2>
          <p>
            {legalConfig.copyrightHolder} operates {siteConfig.name}. This policy explains what personal data we
            collect, why, and how you can control it, in line with the EU General Data Protection Regulation (GDPR).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">2. What we collect</h2>
          <ul>
            <li><strong>Account data</strong>: name, email, company details you provide during onboarding.</li>
            <li><strong>Product data</strong>: your AI system inventory, risk assessments, and generated documents — stored to provide the service and maintain your audit trail.</li>
            <li><strong>Billing data</strong>: subscription and payment metadata; card details are handled entirely by our payment processors (LemonSqueezy, Stripe) and never touch our servers.</li>
            <li><strong>Usage data</strong>: pages visited and product events, collected via Google Analytics if you consent to analytics cookies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">3. Why we process it</h2>
          <p>
            To provide the service you sign up for, to bill you for paid plans, to send transactional and
            (if you opt in) marketing emails, and to meet our own legal obligations. You can manage most email
            preferences from your organization&apos;s <a href="/settings">Settings</a> page, and unsubscribe from any
            individual email via the link in its footer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">4. Who we share it with</h2>
          <p>
            Sub-processors that help us run the service: Firebase/Google Cloud (hosting and database), Vercel
            (application hosting), Anthropic (AI-assisted classification and document drafting — your data is sent
            only as needed to generate a specific result, not used to train models), LemonSqueezy and Stripe
            (payment processing), and Resend (transactional email). If you request an expert review, the relevant
            case details are shared with the consultant you&apos;re matched with.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">5. Retention</h2>
          <p>
            Compliance records (AI system entries, risk assessments, generated documents) are archived rather than
            deleted when superseded, to preserve your audit trail — this mirrors the same integrity requirement the
            EU AI Act itself imposes on your own records. You can request deletion of your account and personal data
            by contacting us; some records may be retained where we have a legal obligation to keep them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">6. Your rights</h2>
          <p>
            Under GDPR you have the right to access, correct, export, or request deletion of your personal data, and
            to object to or restrict certain processing. Contact us at{" "}
            <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a> to exercise any of these.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">7. Cookies</h2>
          <p>
            We use strictly necessary cookies (session authentication) at all times, and analytics cookies (Google
            Analytics) only if you accept them via the cookie banner. You can change your choice at any time by
            clearing your browser&apos;s local storage for this site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">8. Contact</h2>
          <p>
            Questions about this policy or your data: <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
