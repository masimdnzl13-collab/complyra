import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig } from "@/config/site";

export const metadata = constructMetadata({ path: "/" });

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
      <p className="rounded-full bg-navy-50 px-4 py-1 text-sm font-medium text-navy-600">
        Placeholder homepage — scaffold stage
      </p>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-navy-900 sm:text-5xl">
        {siteConfig.name} — {siteConfig.tagline}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-navy-600">
        {siteConfig.description}
      </p>
    </div>
  );
}
