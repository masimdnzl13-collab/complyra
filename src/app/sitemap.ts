import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const marketingRoutes = ["/", "/pricing", "/about", "/blog"];

export default function sitemap(): MetadataRoute.Sitemap {
  return marketingRoutes.map((route) => ({
    url: new URL(route, siteConfig.url).toString(),
    lastModified: new Date(),
  }));
}
