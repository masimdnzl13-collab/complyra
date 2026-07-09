import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig } from "@/config/site";

export const metadata = constructMetadata({
  title: "Page not found",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-navy-900">Page not found</h1>
      <p className="mt-2 text-navy-600">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className="mt-6 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600">
        Back to {siteConfig.name}
      </Link>
    </div>
  );
}
