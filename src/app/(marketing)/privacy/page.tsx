import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig, legalConfig } from "@/config/site";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalTable } from "@/components/legal/legal-table";
import { ManageCookiePreferencesButton } from "@/components/cookie-consent";

export const metadata = constructMetadata({
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses, and protects personal data under the GDPR.`,
  path: "/privacy",
});

const LAST_UPDATED = "2026-07-30";

const LEGAL_BASIS_ROWS: [string, string][] = [
  ["Providing the service you signed up for", "Art. 6(1)(b) — performance of a contract"],
  ["Account creation, authentication, session management", "Art. 6(1)(b) — contract"],
  ["Processing payments and managing subscriptions", "Art. 6(1)(b) — contract"],
  ["Generating risk assessments and compliance documents", "Art. 6(1)(b) — contract"],
  ["Security monitoring, audit logging, fraud prevention", "Art. 6(1)(f) — legitimate interest in protecting the service"],
  ["Sending service and deadline notifications", "Art. 6(1)(b) — contract"],
  ["Sending the newsletter and marketing emails", "Art. 6(1)(a) — consent (withdrawable at any time)"],
  ["Free risk scanner and emailed report", "Art. 6(1)(a) — consent"],
  ["Product analytics", "Art. 6(1)(a) — consent (via cookie banner)"],
  ["Complying with legal obligations", "Art. 6(1)(c) — legal obligation"],
];

const RETENTION_ROWS: [string, string][] = [
  ["Account and organization data", "For the life of your account, then deleted within 90 days of closure"],
  [
    "Compliance documents and assessments",
    "For the life of your account; archived rather than hard-deleted while active, so you retain an audit trail",
  ],
  ["Audit log entries", "24 months"],
  ["Risk scanner results and emails", "24 months, or until you request deletion"],
  ["Newsletter subscription", "Until you unsubscribe"],
  ["Invoices and payment records", "As required by applicable tax law"],
];

export default function PrivacyPage() {
  const { entity, euRepresentative, dataRegions, paymentProvider } = legalConfig;

  const subprocessorRows: [string, string, string, string][] = [
    ["Google Cloud / Firebase", "Database, authentication, file storage", dataRegions.firebase, "EU SCCs; Google is EU-US DPF certified"],
    ["Vercel Inc.", "Application hosting, CDN", `Global edge network; primary region ${dataRegions.vercel}`, "EU SCCs"],
    ["Anthropic PBC", "AI-assisted risk reasoning and document drafting", "United States", "EU SCCs; content is not used to train models"],
    ["Resend", "Transactional and notification emails", "United States / EU", "EU SCCs"],
    [paymentProvider.name, "Payment processing, invoicing, VAT", paymentProvider.region ?? "—", "Merchant of record; EU SCCs"],
    ["Google Analytics 4 (if enabled)", "Product analytics", "EU/US", "Consent-based; IP anonymization enabled"],
    ["Hunter.io", "Business contact enrichment (internal sales use only, not customer data)", "United States", "EU SCCs"],
  ];

  return (
    <LegalPageShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <section>
        <h2 className="text-xl font-semibold text-navy-900">1. Who we are</h2>
        <p>
          {siteConfig.name} (&quot;we&quot;, &quot;us&quot;) provides a software platform that helps organizations
          prepare documentation for compliance with Regulation (EU) 2024/1689 (the EU AI Act).
        </p>
        <p>
          <strong>Data controller:</strong>
          <br />
          {entity.responsibleName}, operating as {siteConfig.name}
          <br />
          {entity.address.country}
          <br />
          Email: <a href={`mailto:${siteConfig.contact.privacyEmail}`}>{siteConfig.contact.privacyEmail}</a>
        </p>
        {euRepresentative.name && (
          <p>
            <strong>EU Representative (GDPR Art. 27):</strong> {euRepresentative.name}, {euRepresentative.address}
            {euRepresentative.email && (
              <>
                {" "}
                — <a href={`mailto:${euRepresentative.email}`}>{euRepresentative.email}</a>
              </>
            )}
          </p>
        )}
        <p>
          We have not appointed a Data Protection Officer, as we do not currently meet the criteria in GDPR Article
          37. You can reach us on any privacy matter at{" "}
          <a href={`mailto:${siteConfig.contact.privacyEmail}`}>{siteConfig.contact.privacyEmail}</a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">2. What data we collect</h2>

        <h3 className="text-base font-semibold text-navy-900">2.1 Account and organization data</h3>
        <p>When you create an account we collect:</p>
        <ul>
          <li>Email address and password (password is hashed; we never see it in plain text)</li>
          <li>Your name, if you provide it</li>
          <li>Organization name, country, sector, approximate size</li>
          <li>Your role within the organization (owner, member, admin)</li>
          <li>Your stated relationship to the EU market (established in the EU, selling into the EU, or neither)</li>
        </ul>

        <h3 className="text-base font-semibold text-navy-900">2.2 Content you enter into the platform</h3>
        <ul>
          <li>AI system inventory entries (system names, descriptions, vendors, data types processed, affected groups, decision role)</li>
          <li>Risk assessment inputs and results</li>
          <li>Generated compliance documents</li>
          <li>Article 50 transparency materials</li>
          <li>AI literacy training records, quiz attempts, and completion certificates</li>
          <li>Expert review requests and any notes you write</li>
        </ul>

        <h3 className="text-base font-semibold text-navy-900">2.3 Free Risk Scanner (no account required)</h3>
        <p>
          If you use the public risk scanner, we store your answers and the generated result. If you request the
          detailed report by email, we also store that email address.
        </p>

        <h3 className="text-base font-semibold text-navy-900">2.4 Technical data</h3>
        <ul>
          <li>IP address, browser type, device type</li>
          <li>Pages visited, actions taken within the application</li>
          <li>Session cookies (see Section 8)</li>
          <li>
            Audit log entries recording security-relevant actions (login, logout, unauthorized access attempts,
            administrative actions, plan changes)
          </li>
        </ul>

        <h3 className="text-base font-semibold text-navy-900">2.5 Payment data</h3>
        <p>
          Payments are processed by our payment provider. <strong>We do not receive, store, or have access to your
          full card details.</strong> We store only the subscription status, plan, billing period, and the
          provider&apos;s customer reference.
        </p>

        <h3 className="text-base font-semibold text-navy-900">2.6 Newsletter</h3>
        <p>If you subscribe, we store your email address and subscription preferences.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">3. Why we process your data, and on what legal basis</h2>
        <LegalTable headers={["Purpose", "Legal basis (GDPR Art. 6)"]} rows={LEGAL_BASIS_ROWS} />
        <p>
          Our legitimate interests under Art. 6(1)(f) are limited to keeping the service secure and functional. We
          have balanced these against your rights and consider the processing proportionate; you can object at any
          time (see Section 7).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">4. Automated decision-making</h2>
        <p>
          The platform produces <strong>automated risk classifications</strong> for the AI systems you enter. These
          classifications:
        </p>
        <ul>
          <li>Are decision-support outputs, not legally binding determinations</li>
          <li>
            Do not produce legal effects concerning you or similarly significantly affect you within the meaning of
            GDPR Article 22
          </li>
          <li>Are always presented with the underlying legal reasoning, so you can review and disagree</li>
          <li>Include an &quot;expert review recommended&quot; flag for borderline cases</li>
        </ul>
        <p>
          We do not use your data for profiling, credit scoring, or any automated decision that has legal or
          similarly significant effects on you.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">5. Who we share data with (subprocessors)</h2>
        <p>
          We use the following service providers. Each processes data only on our instructions under a data
          processing agreement.
        </p>
        <LegalTable headers={["Provider", "Purpose", "Data location", "Safeguard"]} rows={subprocessorRows} />
        <p>We do not sell your data. We do not share it with advertisers.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">6. International transfers</h2>
        <p>
          Some of our providers are located outside the European Economic Area, and we are ourselves established in
          Türkiye. Where personal data is transferred outside the EEA, we rely on:
        </p>
        <ul>
          <li>Standard Contractual Clauses approved by the European Commission, and</li>
          <li>Where applicable, the EU-US Data Privacy Framework certification of the provider.</li>
        </ul>
        <p>
          You may request a copy of the relevant safeguards by writing to{" "}
          <a href={`mailto:${siteConfig.contact.privacyEmail}`}>{siteConfig.contact.privacyEmail}</a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">7. Your rights</h2>
        <p>Under the GDPR you have the right to:</p>
        <ul>
          <li><strong>Access</strong> — obtain a copy of the personal data we hold about you</li>
          <li><strong>Rectification</strong> — correct inaccurate or incomplete data</li>
          <li><strong>Erasure</strong> — request deletion of your data (&quot;right to be forgotten&quot;)</li>
          <li><strong>Restriction</strong> — limit how we process your data</li>
          <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
          <li><strong>Object</strong> — object to processing based on legitimate interests, and to direct marketing at any time</li>
          <li><strong>Withdraw consent</strong> — where processing is based on consent, withdraw it at any time without affecting prior lawful processing</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a href={`mailto:${siteConfig.contact.privacyEmail}`}>{siteConfig.contact.privacyEmail}</a>. We will
          respond within one month.
        </p>
        <p>
          <strong>Right to complain:</strong> You may lodge a complaint with a supervisory authority in the EU
          Member State of your habitual residence, place of work, or place of the alleged infringement.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">8. Cookies</h2>
        <p>We use:</p>
        <ul>
          <li>
            <strong>Strictly necessary cookies</strong> — session authentication, security. These cannot be
            disabled; the service does not function without them.
          </li>
          <li>
            <strong>Analytics cookies</strong> — only with your consent, via the cookie banner. You can withdraw
            consent at any time.
          </li>
        </ul>
        <p>We do not use advertising or cross-site tracking cookies.</p>
        <p>
          You can change your choice at any time:{" "}
          <ManageCookiePreferencesButton />.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">9. How long we keep data</h2>
        <LegalTable headers={["Data", "Retention"]} rows={RETENTION_ROWS} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">10. Security</h2>
        <p>
          We protect your data with organizational isolation (each organization&apos;s data is segregated),
          role-based access control, encrypted transport (TLS), server-side session validation, audit logging, and
          restricted administrative access.
        </p>
        <p>
          See our <Link href="/security">Security page</Link> for details.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">11. Children</h2>
        <p>
          Our service is intended for business use. We do not knowingly collect data from anyone under 18.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">12. Changes to this policy</h2>
        <p>
          We will post any changes on this page and update the &quot;Last updated&quot; date. For material changes
          affecting your rights, we will notify you by email.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">13. Contact</h2>
        <p>
          <a href={`mailto:${siteConfig.contact.privacyEmail}`}>{siteConfig.contact.privacyEmail}</a>
        </p>
      </section>
    </LegalPageShell>
  );
}
