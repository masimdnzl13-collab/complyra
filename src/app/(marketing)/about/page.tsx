import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig } from "@/config/site";

export const metadata = constructMetadata({
  title: "About",
  description: `Learn about ${siteConfig.name} and its mission to simplify EU AI Act compliance documentation.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-navy-900">About {siteConfig.name}</h1>

      <div className="mt-10 space-y-8 text-lg text-navy-600">
        <p>
          The EU AI Act applies to most companies building or using AI, but the documentation it
          requires — an inventory, a risk classification with reasoning, technical documentation,
          transparency notices — is the kind of work that gets postponed indefinitely because
          nobody has a clear starting point. We built {siteConfig.name} because that starting
          point should take hours, not a multi-month engagement with outside counsel.
        </p>
        <p>
          Our risk classification logic and document templates are built directly from the
          published text of the EU AI Act and the European Commission&apos;s official guidance —
          not from second-hand summaries. Where the Act is genuinely ambiguous, we say so, and we
          flag the classification as an edge case rather than presenting false certainty.
        </p>
        <p>
          {siteConfig.name} prepares compliance documentation. It does not provide legal advice,
          and using it does not create a legal or professional relationship — see the disclaimer
          on every page. For decisions with real legal exposure, the output of this platform is a
          starting point for your own counsel, not a replacement for them.
        </p>
      </div>
    </div>
  );
}
