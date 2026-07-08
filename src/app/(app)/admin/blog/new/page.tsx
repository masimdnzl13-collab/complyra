import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { constructMetadata } from "@/lib/construct-metadata";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata = constructMetadata({
  title: "New blog post",
  path: "/admin/blog/new",
  noIndex: true,
});

export default async function AdminNewBlogPostPage() {
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">New blog post</h1>
      <div className="mt-8">
        <BlogPostForm mode="create" />
      </div>
    </div>
  );
}
