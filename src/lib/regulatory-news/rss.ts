import "server-only";

export interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
}

function stripCdataAndTags(raw: string): string {
  const cdataMatch = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  const text = cdataMatch ? cdataMatch[1] : raw;
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(itemXml: string, tag: string): string {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? stripCdataAndTags(match[1]) : "";
}

/**
 * regulatoryUpdates.sourceUrl (derived from `link`) ends up rendered as a
 * raw `href` on the dashboard for every authenticated user — an allowlist
 * here, not just at render time, means a compromised or spoofed feed can't
 * smuggle a javascript:/data: URL all the way through summarization and
 * into Firestore in the first place.
 */
function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Hand-rolled RSS 2.0 parsing via regex rather than an XML library — the
 * format is simple and predictable enough (flat <item> blocks) that adding
 * a dependency for it isn't worth it. Not meant to handle arbitrary/malformed
 * XML; a feed this doesn't parse just yields zero items rather than throwing.
 */
export async function fetchFeedItems(feedUrl: string): Promise<FeedItem[]> {
  const response = await fetch(feedUrl, { headers: { "User-Agent": "VermoncyBot/1.0" } });
  if (!response.ok) {
    throw new Error(`Feed fetch failed: ${response.status}`);
  }
  const xml = await response.text();
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return itemMatches
    .map((itemXml) => ({
      title: extractTag(itemXml, "title"),
      link: extractTag(itemXml, "link"),
      description: extractTag(itemXml, "description"),
      pubDate: extractTag(itemXml, "pubDate") || null,
    }))
    .filter((item) => item.title && item.link && isHttpUrl(item.link));
}
