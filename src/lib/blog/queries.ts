import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type BlogPostDoc } from "@/lib/firestore/schema";
import type { BlogCategory } from "@/config/site";

export type PublicBlogPost = BlogPostDoc & { slug: string };

/**
 * A post is publicly visible once it's "published", or once a "scheduled"
 * post's publishDate has arrived — the whole point of scheduling is that no
 * one has to remember to flip the status by hand.
 */
export async function listPublishedPosts(category?: BlogCategory): Promise<PublicBlogPost[]> {
  const db = getAdminFirestore();
  let query = db
    .collection(firestorePaths.blogPosts())
    .where("status", "in", ["published", "scheduled"])
    .where("publishDate", "<=", Timestamp.now())
    .orderBy("publishDate", "desc");
  if (category) {
    query = db
      .collection(firestorePaths.blogPosts())
      .where("category", "==", category)
      .where("status", "in", ["published", "scheduled"])
      .where("publishDate", "<=", Timestamp.now())
      .orderBy("publishDate", "desc");
  }
  const snap = await query.get();
  return snap.docs.map((d) => ({ slug: d.id, ...(d.data() as BlogPostDoc) }));
}

export async function getPublishedPost(slug: string): Promise<PublicBlogPost | null> {
  const db = getAdminFirestore();
  const snap = await db.doc(firestorePaths.blogPost(slug)).get();
  if (!snap.exists) return null;
  const post = snap.data() as BlogPostDoc;
  const isVisible = post.status === "published" || (post.status === "scheduled" && post.publishDate.toDate() <= new Date());
  if (!isVisible) return null;
  return { slug, ...post };
}
