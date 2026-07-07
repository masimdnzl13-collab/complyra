import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig } from "@/config/site";

export const metadata = constructMetadata({
  title: "Blog",
  description: `Insights on EU AI Act compliance from the ${siteConfig.name} team.`,
  path: "/blog",
});

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Blog</h1>
      <p className="mt-6 text-lg text-navy-600">
        Placeholder page — articles will be added in a later step.
      </p>
    </div>
  );
}
