import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type BlogPostStatus } from "@/lib/firestore/schema";
import { blogCategories } from "@/config/site";

const STATUSES: BlogPostStatus[] = ["draft", "scheduled", "published", "archived"];

interface CreateInput {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  featuredImage: string | null;
  category: string;
  tags: string[];
  publishDate: string;
  status: BlogPostStatus;
  authorName: string;
}

function isValid(body: unknown): body is CreateInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.title === "string" &&
    b.title.trim().length > 0 &&
    typeof b.slug === "string" &&
    /^[a-z0-9-]+$/.test(b.slug) &&
    typeof b.metaDescription === "string" &&
    typeof b.content === "string" &&
    b.content.trim().length > 0 &&
    (b.featuredImage === null || typeof b.featuredImage === "string") &&
    blogCategories.some((c) => c.id === b.category) &&
    Array.isArray(b.tags) &&
    typeof b.publishDate === "string" &&
    !Number.isNaN(new Date(b.publishDate).getTime()) &&
    STATUSES.includes(b.status as BlogPostStatus) &&
    typeof b.authorName === "string"
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValid(body)) {
    return NextResponse.json({ error: "Please fill in every required field" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.blogPost(body.slug));
  const existing = await ref.get();
  if (existing.exists) {
    return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
  }

  const now = FieldValue.serverTimestamp();
  await ref.set({
    title: body.title.trim(),
    metaDescription: body.metaDescription.trim(),
    content: body.content,
    featuredImage: body.featuredImage,
    category: body.category,
    tags: body.tags.map((t) => t.trim()).filter(Boolean),
    publishDate: Timestamp.fromDate(new Date(body.publishDate)),
    status: body.status,
    authorName: body.authorName.trim() || "Complyra Team",
    createdAt: now,
    updatedAt: now,
  });
  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "admin_blog_post_created",
    targetCollection: "blogPosts",
    targetId: body.slug,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, slug: body.slug });
}
