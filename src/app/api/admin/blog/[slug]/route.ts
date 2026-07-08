import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSuperAdminUid } from "@/lib/auth/superadmin";
import { firestorePaths, type BlogPostStatus } from "@/lib/firestore/schema";
import { blogCategories } from "@/config/site";

const STATUSES: BlogPostStatus[] = ["draft", "scheduled", "published", "archived"];

interface RouteParams {
  params: { slug: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
  if (typeof body.metaDescription === "string") updates.metaDescription = body.metaDescription.trim();
  if (typeof body.content === "string" && body.content.trim()) updates.content = body.content;
  if (body.featuredImage === null || typeof body.featuredImage === "string") updates.featuredImage = body.featuredImage;
  if (blogCategories.some((c) => c.id === body.category)) updates.category = body.category;
  if (Array.isArray(body.tags)) updates.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  if (typeof body.publishDate === "string" && !Number.isNaN(new Date(body.publishDate).getTime())) {
    updates.publishDate = Timestamp.fromDate(new Date(body.publishDate));
  }
  if (STATUSES.includes(body.status)) updates.status = body.status;
  if (typeof body.authorName === "string" && body.authorName.trim()) updates.authorName = body.authorName.trim();

  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.blogPost(params.slug));
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ref.update(updates);
  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "admin_blog_post_updated",
    targetCollection: "blogPosts",
    targetId: params.slug,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdminUid(user.uid)) {
    return NextResponse.json({ error: "Only the platform superadmin can do this" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const ref = db.doc(firestorePaths.blogPost(params.slug));
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ref.delete();
  await db.collection(firestorePaths.platformAuditLog()).add({
    actorId: user.uid,
    action: "admin_blog_post_deleted",
    targetCollection: "blogPosts",
    targetId: params.slug,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
