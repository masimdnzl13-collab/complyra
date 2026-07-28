import { constructMetadata } from "@/lib/construct-metadata";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata = constructMetadata({
  title: "New blog post",
  path: "/admin/blog/new",
  noIndex: true,
});

export default async function AdminNewBlogPostPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">New blog post</h1>
      <div className="mt-8">
        <BlogPostForm mode="create" />
      </div>
    </div>
  );
}
