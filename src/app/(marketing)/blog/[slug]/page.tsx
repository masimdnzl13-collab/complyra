import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig, blogCategories } from "@/config/site";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog/queries";
import { ReadTracker } from "@/components/marketing/read-tracker";
import { TrackedCtaLink } from "@/components/marketing/tracked-cta-link";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPublishedPost(params.slug);
  if (!post) return constructMetadata({ title: "Post not found", path: `/blog/${params.slug}`, noIndex: true });

  return constructMetadata({
    title: post.title,
    description: post.metaDescription,
    path: `/blog/${params.slug}`,
    ogType: "article",
    ogImage: post.featuredImage ?? undefined,
    publishedTime: post.publishDate.toDate().toISOString(),
    authors: [post.authorName],
    tags: post.tags,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();

  const allInCategory = await listPublishedPosts(post.category).catch(() => []);
  const relatedPosts = allInCategory.filter((p) => p.slug !== post.slug).slice(0, 3);

  const postUrl = new URL(`/blog/${params.slug}`, siteConfig.url).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    image: post.featuredImage ? [new URL(post.featuredImage, siteConfig.url).toString()] : undefined,
    datePublished: post.publishDate.toDate().toISOString(),
    dateModified: post.updatedAt.toDate().toISOString(),
    author: { "@type": "Organization", name: post.authorName },
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: postUrl,
  };

  const shareText = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(postUrl);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReadTracker slug={params.slug} />

      <span className="text-xs font-medium uppercase tracking-wide text-accent">
        {blogCategories.find((c) => c.id === post.category)?.label}
      </span>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">{post.title}</h1>
      <p className="mt-2 text-sm text-navy-500">
        {post.authorName} · {post.publishDate.toDate().toLocaleDateString()}
      </p>

      {post.featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.featuredImage} alt={post.title} className="mt-6 w-full rounded-xl border border-navy-100" />
      )}

      <div className="prose mt-8 max-w-none prose-headings:text-navy-900 prose-strong:text-navy-900 prose-a:text-accent">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      <div className="mt-8 flex items-center gap-4 border-t border-navy-100 pt-6">
        <span className="text-xs font-medium text-navy-500">Share:</span>
        <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:text-accent-600">
          Twitter
        </a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:text-accent-600">
          LinkedIn
        </a>
      </div>

      <div className="mt-8 rounded-xl border border-navy-100 bg-navy-50 p-6 text-center">
        <p className="text-sm font-semibold text-navy-900">See how Complyra can help you prepare</p>
        <TrackedCtaLink
          href="/risk-scan"
          label="Start your free risk scan"
          ctaId={`blog-post-${params.slug}`}
          className="mt-3 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
        />
      </div>

      {relatedPosts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">Related posts</h2>
          <div className="mt-3 space-y-3">
            {relatedPosts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="block rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm font-medium text-navy-900 hover:bg-navy-50">
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
