import { notFound } from "next/navigation";
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
