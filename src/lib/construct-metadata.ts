import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface ConstructMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}

/**
 * Every page builds its metadata through this function so title templates,
 * Open Graph tags, and canonical URLs stay consistent without each page
 * repeating siteConfig values by hand.
 */
export function constructMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
}: ConstructMetadataOptions = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`;
  const url = new URL(path, siteConfig.url).toString();

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.language,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
