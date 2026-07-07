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
      <p className="mt-6 text-lg text-navy-600">
        Placeholder page — company story and team content will be added in a later step.
      </p>
    </div>
  );
}
