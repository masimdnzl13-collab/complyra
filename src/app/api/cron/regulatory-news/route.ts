import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type NewsletterSubscriberDoc, type RegulatoryUpdateDoc } from "@/lib/firestore/schema";
import { fetchFeedItems } from "@/lib/regulatory-news/rss";
import { summarizeRegulatoryUpdates } from "@/lib/regulatory-news/summarize";
import { sendWeeklyDigestEmail } from "@/lib/email/send-automation-email";
import { authorizeCronRequest } from "@/lib/cron/authorize";
import { withCronRunLogging } from "@/lib/cron/log-run";

/**
 * Verified working via a live fetch during development (see P14 build
 * notes) — an unofficial but well-maintained AI Act tracker. Additional
 * sources (EC News, Member State guidance) weren't added because their
 * feed URLs weren't verified to actually exist; add them here once
 * confirmed rather than guessing at a URL.
 */
const RSS_FEED_URLS = ["https://artificialintelligenceact.eu/feed/"];

const KEYWORDS = ["ai act", "digital omnibus", "article 50", "annex iii"];

function matchesKeywords(item: { title: string; description: string }): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return KEYWORDS.some((kw) => text.includes(kw));
}

export async function GET(request: NextRequest) {
  const auth = await authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await withCronRunLogging("regulatory-news", auth.triggeredBy, async (counters) => {
    const db = getAdminFirestore();
    const now = new Date();

    let fetchedCount = 0;
    let newItemsCount = 0;

    for (const feedUrl of RSS_FEED_URLS) {
      try {
        const items = await fetchFeedItems(feedUrl);
        fetchedCount += items.length;
        const relevant = items.filter(matchesKeywords);

        const existingSnap = await db.collection(firestorePaths.regulatoryUpdates()).get();
        const existingUrls = new Set(existingSnap.docs.map((d) => (d.data() as RegulatoryUpdateDoc).sourceUrl));
        const newItems = relevant.filter((item) => !existingUrls.has(item.link));

        if (newItems.length === 0) continue;

        const summarized = await summarizeRegulatoryUpdates(newItems);
        const batch = db.batch();
        for (let i = 0; i < summarized.length; i++) {
          const ref = db.collection(firestorePaths.regulatoryUpdates()).doc();
          const sourceItem = newItems[i];
          batch.set(ref, {
            title: summarized[i].title,
            summary: summarized[i].summary,
            sourceUrl: summarized[i].sourceUrl,
            category: summarized[i].category,
            publishedAt: sourceItem.pubDate ? Timestamp.fromDate(new Date(sourceItem.pubDate)) : FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
        newItemsCount += summarized.length;
      } catch {
        // One feed failing shouldn't block the others or the digest below.
      }
    }
    counters.processedCount = fetchedCount;

    let digestSent = 0;
    const isFriday = now.getUTCDay() === 5;
    if (isFriday) {
      const weekAgo = Timestamp.fromMillis(now.getTime() - 7 * 86_400_000);
      const recentSnap = await db
        .collection(firestorePaths.regulatoryUpdates())
        .where("createdAt", ">=", weekAgo)
        .get();
      const recentItems = recentSnap.docs.map((d) => d.data() as RegulatoryUpdateDoc);

      if (recentItems.length > 0) {
        const subscribersSnap = await db.collection(firestorePaths.newsletterSubscribers()).get();
        const subscribers = subscribersSnap.docs
          .map((d) => d.data() as NewsletterSubscriberDoc)
          .filter((s) => !s.unsubscribed);

        for (const subscriber of subscribers) {
          try {
            await sendWeeklyDigestEmail({
              to: subscriber.email,
              items: recentItems.map((item) => ({ title: item.title, summary: item.summary, sourceUrl: item.sourceUrl })),
            });
            counters.emailsSent++;
            digestSent++;
          } catch {
            counters.emailsFailed++;
          }
        }
      }
    }

    return {
      ok: true,
      ranAt: now.toISOString(),
      fetchedCount,
      newItemsCount,
      digestSent,
    };
  });

  return NextResponse.json(result);
}
