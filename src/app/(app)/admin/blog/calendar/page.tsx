import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type BlogPostDoc, type BlogPostStatus } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";

export const metadata = constructMetadata({
  title: "Content calendar",
  path: "/admin/blog/calendar",
  noIndex: true,
});

const STATUS_STYLES: Record<BlogPostStatus, string> = {
  draft: "bg-navy-100 text-navy-500",
  scheduled: "bg-warning/10 text-warning",
  published: "bg-success/10 text-success",
  archived: "bg-navy-100 text-navy-400",
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function AdminBlogCalendarPage() {
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
  const snap = await db.collection(firestorePaths.blogPosts()).orderBy("publishDate", "asc").get();
  const posts = snap.docs.map((d) => ({ slug: d.id, ...(d.data() as BlogPostDoc) }));

  const byMonth = new Map<string, typeof posts>();
  for (const post of posts) {
    const d = post.publishDate.toDate();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(post);
  }
  const months = Array.from(byMonth.keys()).sort();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Content calendar</h1>
        <Link href="/admin/blog" className="text-sm font-medium text-accent hover:text-accent-600">
          ← Back to posts
        </Link>
      </div>

      <div className="mt-6">
        <AdminSubNav active="/admin/blog" />
      </div>

      {months.length === 0 ? (
        <p className="text-sm text-navy-500">No posts scheduled yet.</p>
      ) : (
        <div className="space-y-8">
          {months.map((monthKey) => {
            const [year, month] = monthKey.split("-").map(Number);
            const monthPosts = byMonth.get(monthKey)!;
            return (
              <div key={monthKey}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400">
                  {MONTH_NAMES[month - 1]} {year}
                </h2>
                <div className="mt-3 space-y-2">
                  {monthPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/admin/blog/${post.slug}/edit`}
                      className="flex items-center justify-between rounded-md border border-navy-100 bg-surface px-4 py-2.5 text-sm hover:bg-navy-50"
                    >
                      <span className="text-navy-900">
                        <span className="mr-3 text-navy-400">{post.publishDate.toDate().getDate()}</span>
                        {post.title}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[post.status]}`}>{post.status}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
