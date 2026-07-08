import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listPublishedPosts } from "@/lib/blog/queries";

// Queries Firestore, so this can't be statically generated at build time —
// force it to run per-request instead. Also means a missing/rebuilding
// index degrades to "blog posts omitted" rather than breaking the sitemap
// (and the build) outright; see the try/catch below.
export const dynamic = "force-dynamic";

const marketingRoutes = [
  "/",
  "/pricing",
  "/about",
  "/blog",
  "/risk-scan",
  "/article-50-compliance",
  "/high-risk-ai-systems",
  "/for-consultants",
  "/export-compliance",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = marketingRoutes.map((route) => ({
    url: new URL(route, siteConfig.url).toString(),
    lastModified: new Date(),
  }));

  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await listPublishedPosts();
    postEntries = posts.map((post) => ({
      url: new URL(`/blog/${post.slug}`, siteConfig.url).toString(),
      lastModified: post.updatedAt.toDate(),
    }));
  } catch {
    // A missing/rebuilding Firestore index shouldn't take down the whole sitemap — the static routes still matter.
  }

  return [...staticEntries, ...postEntries];
}
