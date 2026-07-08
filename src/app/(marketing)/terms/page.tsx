import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig, legalConfig } from "@/config/site";

export const metadata = constructMetadata({
  title: "Terms of Service",
  description: `The terms governing use of ${siteConfig.name}.`,
  path: "/terms",
});

const LAST_UPDATED = "2026-07-09";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-navy-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose mt-10 max-w-none space-y-6 text-navy-700 prose-headings:text-navy-900 prose-a:text-accent">
        <section>
          <h2 className="text-xl font-semibold text-navy-900">1. What {siteConfig.name} is</h2>
          <p>
            {siteConfig.name} ({legalConfig.copyrightHolder}, &quot;we&quot;, &quot;us&quot;) is a documentation
            preparation tool for EU AI Act compliance. {legalConfig.disclaimer}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">2. Your account</h2>
          <p>
            You&apos;re responsible for the accuracy of the information you enter about your organization and AI
            systems, and for keeping your login credentials secure. One organization per account — accepting a
            team invite moves your membership to the new organization rather than adding a second one.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">3. Subscriptions and billing</h2>
          <p>
            Paid plans are billed by LemonSqueezy, acting as merchant of record, in EUR. Plan limits, pricing, and
            trial terms are shown on our <a href="/pricing">pricing page</a> and may change with notice. You can
            cancel anytime from your billing settings; access continues until the end of the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">4. Expert review marketplace</h2>
          <p>
            Expert reviews are provided by independent consultants, not by {siteConfig.name}. Consultant honoraria
            are collected through the platform, and {siteConfig.name} retains a commission. We are not liable for
            the accuracy, completeness, or legal correctness of any consultant&apos;s review — for disputes, contact
            the consultant directly, as noted on every delivered report.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">5. Acceptable use</h2>
          <p>
            Don&apos;t use {siteConfig.name} to store data you don&apos;t have the right to process, to attempt to
            circumvent plan limits or security controls, or to resell access without a written partner agreement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">6. Disclaimer and limitation of liability</h2>
          <p>{legalConfig.disclaimer}</p>
          <p>
            {siteConfig.name} is provided &quot;as is&quot;, without warranties of any kind. To the maximum extent
            permitted by law, {legalConfig.copyrightHolder} is not liable for indirect, incidental, or consequential
            damages arising from use of the platform, including decisions made based on generated documentation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">7. Changes</h2>
          <p>
            We may update these terms as the product changes. Material changes will be reflected by an updated
            &quot;last updated&quot; date above.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-navy-900">8. Contact</h2>
          <p>
            Questions about these terms: <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
