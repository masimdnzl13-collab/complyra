import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type BlogPostDoc, type BlogPostStatus } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { blogCategories } from "@/config/site";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { DeleteBlogPostButton } from "@/components/admin/delete-blog-post-button";

export const metadata = constructMetadata({
  title: "Blog admin",
  path: "/admin/blog",
  noIndex: true,
});

const STATUS_STYLES: Record<BlogPostStatus, string> = {
  draft: "bg-navy-100 text-navy-500",
  scheduled: "bg-warning/10 text-warning",
  published: "bg-success/10 text-success",
  archived: "bg-navy-100 text-navy-400",
};

export default async function AdminBlogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperAdminUid(user.uid)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">403 — Forbidden</h1>
        <p className="mt-2 text-navy-600">This page is only available to the platform superadmin.</p>
      </div>
    );
  }

  const db = getAdminFirestore();
  const snap = await db.collection(firestorePaths.blogPosts()).orderBy("publishDate", "desc").get();
  const posts = snap.docs.map((d) => ({ slug: d.id, ...(d.data() as BlogPostDoc) }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Blog</h1>
          <p className="mt-1 text-navy-600">{posts.length} posts.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/blog/calendar" className="rounded-md border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
            Content calendar
          </Link>
          <Link href="/admin/blog/new" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
            New post
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <AdminSubNav active="/admin/blog" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-navy-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Publish date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-navy-500">
                  No posts yet.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.slug} className="border-b border-navy-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy-900">
                    <Link href={`/admin/blog/${post.slug}/edit`} className="hover:text-accent">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-500">{blogCategories.find((c) => c.id === post.category)?.label ?? post.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[post.status]}`}>{post.status}</span>
                  </td>
                  <td className="px-4 py-3 text-navy-500">{post.publishDate.toDate().toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <DeleteBlogPostButton slug={post.slug} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
