import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig, legalConfig } from "@/config/site";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalTable } from "@/components/legal/legal-table";

export const metadata = constructMetadata({
  title: "Security",
  description: `How ${siteConfig.name} protects your organization's AI system inventory and compliance data.`,
  path: "/security",
});

const LAST_UPDATED = "2026-07-30";

export default function SecurityPage() {
  const { dataRegions } = legalConfig;

  const infrastructureRows: [string, string, string][] = [
    ["Application hosting", "Vercel", "TLS 1.2+ enforced, automatic certificate management"],
    ["Database", "Google Cloud Firestore", "Encrypted at rest by the provider"],
    ["Authentication", "Firebase Authentication", "Passwords hashed by Google; we never see plain text"],
    ["Email delivery", "Resend", "Transactional and notification email only"],
    ["AI processing", "Anthropic API", "Content is not used to train models"],
  ];

  return (
    <LegalPageShell title="Security at Vermoncy" lastUpdated={LAST_UPDATED}>
      <p>
        We handle your organization&apos;s AI system inventory, risk classifications, and compliance documentation.
        That is sensitive material, and we treat it that way. This page explains exactly how — including what we
        have not built yet.
      </p>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">1. Infrastructure</h2>
        <LegalTable headers={["Layer", "Provider", "Notes"]} rows={infrastructureRows} />
        <p>
          Primary data region: <strong>{dataRegions.firebase}</strong>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">2. Data isolation</h2>
        <p>
          Every organization&apos;s data is stored under a segregated path and every read and write is scoped to the
          requesting user&apos;s organization at both the application layer and the database rule layer.
        </p>
        <p>
          This means a user in one organization cannot access another organization&apos;s AI systems, assessments,
          documents, training records, or billing information — even by manipulating record identifiers directly in
          the URL.
        </p>
        <p>
          Database security rules enforce this independently of the application code, so a bug in the application
          alone cannot expose cross-organization data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">3. Authentication and sessions</h2>
        <ul>
          <li>Passwords are hashed by Firebase Authentication; they are never stored or transmitted in plain text</li>
          <li>Google sign-in is supported as an alternative</li>
          <li>Session cookies are <code>httpOnly</code>, <code>secure</code>, and <code>sameSite</code> — they cannot be read by client-side JavaScript</li>
          <li>Sessions expire after <strong>5 days</strong>, after which re-authentication is required</li>
          <li>Signing out revokes the refresh token server-side, not only the local cookie — a copied cookie cannot be reused after logout</li>
          <li>All protected routes are enforced at the middleware layer, before any page content is rendered</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">4. Authorization</h2>
        <p>
          Access within an organization is role-based (owner, admin, member). Critical write operations —
          subscription changes, usage counters, audit log entries, team invitations — are performed exclusively
          server-side through the Firebase Admin SDK. The client cannot write to these collections under any
          circumstance.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">5. Administrative access</h2>
        <p>
          Platform administration is restricted to a single named account on a server-side allowlist. Administrative
          routes are protected by three independent layers:
        </p>
        <ol>
          <li>Server-side verification of the authenticated identity against the allowlist</li>
          <li>Conditional rendering — administrative navigation is not exposed to unauthorized users</li>
          <li>
            A separate password gate with a scrypt-hashed secret, HMAC-signed session token, rate limiting (5
            attempts per 15 minutes), and an 8-hour expiry
          </li>
        </ol>
        <p>Every administrative action is written to the audit log.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">6. Audit logging</h2>
        <p>
          We record security-relevant events including sign-in and sign-out, failed administrative authentication
          attempts, unauthorized access attempts, all administrative actions, subscription changes, and team
          membership changes.
        </p>
        <p>Audit entries are server-written only and cannot be modified or deleted by users.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">7. AI processing safeguards</h2>
        <p>When we send your content to an AI model for risk reasoning or document drafting:</p>
        <ul>
          <li>
            User-supplied text is wrapped in explicit delimiters and the model is instructed to treat it as data,
            never as instructions — mitigating prompt injection
          </li>
          <li>Input length is bounded and validated at the API layer before submission</li>
          <li>Model output is validated against a strict schema before it is stored or shown</li>
          <li>API calls include timeout and retry handling with exponential backoff</li>
          <li>
            Deterministic rules handle clear-cut cases (prohibited practices under Article 5, Annex III categories);
            the model is consulted only for genuinely ambiguous cases
          </li>
          <li>Your content is not used to train the model</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">8. Application security</h2>
        <ul>
          <li>
            All API routes require authentication and organization-scope verification, except a small set of
            deliberately public endpoints (risk scanner, newsletter, webhooks, cron)
          </li>
          <li>Webhook endpoints verify cryptographic signatures</li>
          <li>Scheduled job endpoints require a secret token</li>
          <li>Public endpoints are rate-limited</li>
          <li>No secrets are present in the client-side bundle; this is verified before each release</li>
          <li>Error responses to users do not expose stack traces or internal system detail</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">9. What we have not done yet</h2>
        <p>We would rather tell you this directly than have you discover it during procurement.</p>
        <ul>
          <li>
            <strong>No SOC 2 or ISO 27001 certification.</strong> We are an early-stage product. If your procurement
            process requires certification, we are not yet a fit.
          </li>
          <li>
            <strong>No independent penetration test.</strong> Our security posture has been reviewed internally and
            hardened, but not audited by a third party.
          </li>
          <li>
            <strong>No formal incident response SLA.</strong> We will notify affected customers without undue delay
            and, where the GDPR requires it, the relevant supervisory authority within 72 hours — but we do not yet
            publish a contractual response time.
          </li>
          <li>
            <strong>No bug bounty programme.</strong> If you find a vulnerability, please report it to{" "}
            {siteConfig.contact.securityEmail}. We will acknowledge within 2 business days.
          </li>
          <li>
            <strong>Company registration in progress.</strong> {siteConfig.name} currently operates as a sole
            proprietorship; Turkish company registration is underway.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">10. Reporting a vulnerability</h2>
        <p>
          Email <a href={`mailto:${siteConfig.contact.securityEmail}`}>{siteConfig.contact.securityEmail}</a>.
          Please include steps to reproduce. We ask that you give us a reasonable window to remediate before public
          disclosure. We do not pursue legal action against good-faith security research.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">11. Data processing agreement</h2>
        <p>
          A Data Processing Agreement (DPA) is available for customers who require one. Request it at{" "}
          <a href={`mailto:${siteConfig.contact.privacyEmail}`}>{siteConfig.contact.privacyEmail}</a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">12. Subprocessors</h2>
        <p>
          Our current subprocessor list is published in our{" "}
          <Link href="/privacy">Privacy Policy</Link>. We will notify customers of new subprocessors before they
          begin processing customer data.
        </p>
      </section>
    </LegalPageShell>
  );
}
