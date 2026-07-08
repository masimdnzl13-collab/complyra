import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type BlogPostDoc } from "@/lib/firestore/schema";
import { constructMetadata } from "@/lib/construct-metadata";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata = constructMetadata({
  title: "Edit blog post",
  path: "/admin/blog",
  noIndex: true,
});

interface PageProps {
  params: { slug: string };
}

export default async function AdminEditBlogPostPage({ params }: PageProps) {
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

  const snap = await getAdminFirestore().doc(firestorePaths.blogPost(params.slug)).get();
  if (!snap.exists) notFound();
  const post = snap.data() as BlogPostDoc;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Edit post</h1>
      <div className="mt-8">
        <BlogPostForm
          mode="edit"
          initialValues={{
            title: post.title,
            slug: params.slug,
            metaDescription: post.metaDescription,
            content: post.content,
            featuredImage: post.featuredImage ?? "",
            category: post.category,
            tags: post.tags.join(", "),
            publishDate: post.publishDate.toDate().toISOString().slice(0, 10),
            status: post.status,
            authorName: post.authorName,
          }}
        />
      </div>
    </div>
  );
}
