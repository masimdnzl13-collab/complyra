"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

/** Fires blog_post_read once the visitor has stayed on the post for 2+ minutes. */
export function ReadTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const timer = setTimeout(() => trackEvent("blog_post_read", { slug }), 2 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [slug]);

  return null;
}
