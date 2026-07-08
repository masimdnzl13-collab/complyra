import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { blogCategories, type BlogCategory } from "@/config/site";
import { listPublishedPosts } from "@/lib/blog/queries";

export const metadata = constructMetadata({
  title: "Blog",
  description: "EU AI Act compliance guides, deadline breakdowns, and product updates from Complyra.",
  path: "/blog",
});

interface PageProps {
  searchParams: { category?: string; q?: string };
}

export default async function BlogPage({ searchParams }: PageProps) {
  const activeCategory = searchParams.category as BlogCategory | undefined;
  const allPosts = await listPublishedPosts(activeCategory).catch(() => []);
  const posts = searchParams.q
    ? allPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchParams.q!.toLowerCase()))
      )
    : allPosts;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Blog</h1>
      <p className="mt-1 text-navy-600">EU AI Act compliance guides, deadline breakdowns, and product updates.</p>

      <form className="mt-6 flex flex-wrap items-center gap-3" action="/blog">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search posts"
          className="rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        <button type="submit" className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/blog" className={`rounded-full px-3 py-1 text-xs font-medium ${!activeCategory ? "bg-accent text-white" : "bg-navy-100 text-navy-600"}`}>
          All
        </Link>
        {blogCategories.map((c) => (
          <Link
            key={c.id}
            href={`/blog?category=${c.id}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${activeCategory === c.id ? "bg-accent text-white" : "bg-navy-100 text-navy-600"}`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-navy-500">No posts here yet — check back soon.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block rounded-xl border border-navy-100 bg-surface p-6 hover:bg-navy-50">
              <span className="text-xs font-medium uppercase tracking-wide text-accent">
                {blogCategories.find((c) => c.id === post.category)?.label}
              </span>
              <h2 className="mt-1 text-lg font-semibold text-navy-900">{post.title}</h2>
              <p className="mt-1 text-sm text-navy-600">{post.metaDescription}</p>
              <p className="mt-2 text-xs text-navy-400">
                {post.authorName} · {post.publishDate.toDate().toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
