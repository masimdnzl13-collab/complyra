import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface ConstructMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  /** "article" for blog posts — adds publishedTime/authors/tags to Open Graph. Defaults to "website". */
  ogType?: "website" | "article";
  ogImage?: string;
  publishedTime?: string;
  authors?: string[];
  tags?: string[];
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
  ogType = "website",
  ogImage,
  publishedTime,
  authors,
  tags,
}: ConstructMetadataOptions = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`;
  const url = new URL(path, siteConfig.url).toString();
  const images = ogImage ? [{ url: new URL(ogImage, siteConfig.url).toString() }] : undefined;

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph:
      ogType === "article"
        ? {
            title: pageTitle,
            description,
            url,
            siteName: siteConfig.name,
            locale: siteConfig.language,
            type: "article",
            images,
            publishedTime,
            authors,
            tags,
          }
        : {
            title: pageTitle,
            description,
            url,
            siteName: siteConfig.name,
            locale: siteConfig.language,
            type: "website",
            images,
          },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: ogImage ? [new URL(ogImage, siteConfig.url).toString()] : undefined,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
