import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/onboarding",
          "/consultant",
          "/billing",
          "/checkout",
          "/settings",
          "/admin",
          "/ai-systems",
          "/assessments",
          "/documents",
          "/expert-reviews",
          // Trailing slash so this doesn't also match the public
          // /article-50-compliance landing page (robots.txt prefix-matches).
          "/article-50/",
          "/api",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
