"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { blogCategories, type BlogCategory } from "@/config/site";
import type { BlogPostStatus } from "@/lib/firestore/schema";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export interface BlogPostFormValues {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  featuredImage: string;
  category: BlogCategory;
  tags: string;
  publishDate: string;
  status: BlogPostStatus;
  authorName: string;
}

interface BlogPostFormProps {
  mode: "create" | "edit";
  initialValues?: BlogPostFormValues;
}

const DEFAULTS: BlogPostFormValues = {
  title: "",
  slug: "",
  metaDescription: "",
  content: "",
  featuredImage: "",
  category: "eu-ai-act-compliance",
  tags: "",
  publishDate: new Date().toISOString().slice(0, 10),
  status: "draft",
  authorName: "Complyra Team",
};

export function BlogPostForm({ mode, initialValues }: BlogPostFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<BlogPostFormValues>(initialValues ?? DEFAULTS);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [showPreview, setShowPreview] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [seoResult, setSeoResult] = useState<{ primaryKeywordCount: number; relatedKeywords: string[]; suggestions: string[] } | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);

  function set<K extends keyof BlogPostFormValues>(key: K, value: BlogPostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleTitleChange(title: string) {
    set("title", title);
    if (!slugEdited) set("slug", slugify(title));
  }

  async function handleSuggestSeo() {
    if (!primaryKeyword.trim()) return;
    setSeoLoading(true);
    setSeoResult(null);
    try {
      const response = await fetch("/api/admin/blog/seo-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: values.content, primaryKeyword }),
      });
      if (!response.ok) throw new Error();
      setSeoResult(await response.json());
    } catch {
      setSeoResult(null);
    } finally {
      setSeoLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const payload = {
        title: values.title,
        slug: values.slug,
        metaDescription: values.metaDescription,
        content: values.content,
        featuredImage: values.featuredImage.trim() || null,
        category: values.category,
        tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
        publishDate: values.publishDate,
        status: values.status,
        authorName: values.authorName,
      };
      const url = mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${values.slug}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const titleLen = values.title.length;
  const metaLen = values.metaDescription.length;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-900">
            Title
            <span className={`text-xs font-normal ${titleLen >= 50 && titleLen <= 60 ? "text-success" : "text-navy-400"}`}>
              {titleLen}/60 (optimal 50–60)
            </span>
          </span>
          <input
            required
            value={values.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Slug</span>
          <input
            required
            value={values.slug}
            disabled={mode === "edit"}
            onChange={(e) => {
              setSlugEdited(true);
              set("slug", slugify(e.target.value));
            }}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 disabled:bg-navy-50 disabled:text-navy-500"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy-900">
            Meta description
            <span className={`text-xs font-normal ${metaLen >= 150 && metaLen <= 160 ? "text-success" : "text-navy-400"}`}>
              {metaLen}/160 (optimal 150–160)
            </span>
          </span>
          <textarea
            required
            rows={2}
            value={values.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
            className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900"
          />
        </label>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-navy-900">Content (Markdown)</span>
            <button type="button" onClick={() => setShowPreview((v) => !v)} className="text-xs font-medium text-accent hover:text-accent-600">
              {showPreview ? "Edit" : "Preview"}
            </button>
          </div>
          {showPreview ? (
            <div className="prose prose-sm max-w-none rounded-md border border-navy-100 bg-surface px-4 py-3 prose-headings:text-navy-900 prose-strong:text-navy-900">
              <ReactMarkdown>{values.content || "*Nothing to preview yet.*"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              required
              rows={18}
              value={values.content}
              onChange={(e) => set("content", e.target.value)}
              className="w-full rounded-md border border-navy-100 px-3 py-2 font-mono text-sm text-navy-900"
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Category</span>
          <select value={values.category} onChange={(e) => set("category", e.target.value as BlogCategory)} className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900">
            {blogCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Tags (comma-separated)</span>
          <input value={values.tags} onChange={(e) => set("tags", e.target.value)} className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Featured image URL</span>
          <input value={values.featuredImage} onChange={(e) => set("featuredImage", e.target.value)} className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Publish date</span>
          <input type="date" value={values.publishDate} onChange={(e) => set("publishDate", e.target.value)} className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Status</span>
          <select value={values.status} onChange={(e) => set("status", e.target.value as BlogPostStatus)} className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900">
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy-900">Author</span>
          <input value={values.authorName} onChange={(e) => set("authorName", e.target.value)} className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900" />
        </label>

        <div className="rounded-md border border-navy-100 bg-navy-50 p-3">
          <p className="mb-2 text-xs font-semibold text-navy-700">SEO helper</p>
          <div className="flex gap-2">
            <input
              placeholder="Primary keyword"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              className="flex-1 rounded-md border border-navy-100 px-2 py-1.5 text-xs text-navy-900"
            />
            <button
              type="button"
              onClick={handleSuggestSeo}
              disabled={seoLoading || !primaryKeyword.trim() || !values.content.trim()}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-50"
            >
              {seoLoading ? "…" : "Analyze"}
            </button>
          </div>
          {seoResult && (
            <div className="mt-2 space-y-1 text-xs text-navy-700">
              <p>Keyword mentions: {seoResult.primaryKeywordCount}</p>
              <p>Related keywords: {seoResult.relatedKeywords.join(", ")}</p>
              <ul className="list-disc pl-4">
                {seoResult.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={status === "saving"} className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50">
          {status === "saving" ? "Saving…" : mode === "create" ? "Create post" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
