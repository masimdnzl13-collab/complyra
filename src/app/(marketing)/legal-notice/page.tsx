import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig, legalConfig } from "@/config/site";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata = constructMetadata({
  title: "Legal Notice",
  description: `Legal notice and provider identification for ${siteConfig.name}.`,
  path: "/legal-notice",
});

const LAST_UPDATED = "2026-07-30";

export default function LegalNoticePage() {
  const { entity, euRepresentative, businessRegistration } = legalConfig;
  const hasFullAddress = Boolean(entity.address.street);
  const registrationRows = [
    ["Commercial Register Number", businessRegistration.tradeRegisterNumber],
    ["Tax Identification Number", businessRegistration.taxId],
    ["MERSİS Number", businessRegistration.mersisNo],
  ].filter(([, value]) => value) as [string, string][];

  return (
    <LegalPageShell title="Legal Notice" lastUpdated={LAST_UPDATED}>
      <section>
        <h2 className="text-xl font-semibold text-navy-900">Service provider</h2>
        <p>
          {siteConfig.name}
          <br />
          {entity.responsibleName}
          {hasFullAddress && (
            <>
              <br />
              {entity.address.street}
              <br />
              {entity.address.postalCode} {entity.address.city}
            </>
          )}
          <br />
          {entity.address.country}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Contact</h2>
        <p>
          Email: <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
          <br />
          Support: <a href={`mailto:${siteConfig.contact.supportEmail}`}>{siteConfig.contact.supportEmail}</a>
          {entity.phone && (
            <>
              <br />
              Phone: {entity.phone}
            </>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Responsible for content</h2>
        <p>
          {entity.responsibleName}
          <br />
          {entity.address.country}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Business status</h2>
        <p>
          {siteConfig.name} is currently operated as a sole proprietorship. Company registration in Turkey is in
          progress; commercial register details and VAT identification number will be published here once available.
        </p>
        {registrationRows.length > 0 && (
          <ul>
            {registrationRows.map(([label, value]) => (
              <li key={label}>
                {label}: {value}
              </li>
            ))}
          </ul>
        )}
      </section>

      {euRepresentative.name && (
        <section>
          <h2 className="text-xl font-semibold text-navy-900">EU representative</h2>
          <p>
            {euRepresentative.name}
            <br />
            {euRepresentative.address}
            <br />
            {euRepresentative.email && (
              <a href={`mailto:${euRepresentative.email}`}>{euRepresentative.email}</a>
            )}
          </p>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Dispute resolution</h2>
        <p>
          The European Commission provides a platform for online dispute resolution:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
          .
        </p>
        <p>
          We are neither obliged nor willing to participate in dispute settlement proceedings before a consumer
          arbitration board.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Liability for content</h2>
        <p>
          We create the content of these pages with care. However, we cannot guarantee that the content is accurate,
          complete, or current.
        </p>
        <p>{legalConfig.disclaimer}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Liability for links</h2>
        <p>
          Our site contains links to external websites over which we have no control. We accept no liability for
          their content. The respective provider or operator of the linked pages is always responsible for their
          content.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Copyright</h2>
        <p>
          The content and works on these pages are protected by copyright. Reproduction, processing, distribution, or
          any form of commercialization beyond the scope of copyright law requires our prior written consent.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-navy-900">Related</h2>
        <p>
          See also our <Link href="/privacy">Privacy Policy</Link> and <Link href="/security">Security</Link> pages.
        </p>
      </section>
    </LegalPageShell>
  );
}
