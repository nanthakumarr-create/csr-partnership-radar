import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import type { RawItem } from "../types";

const FEED_URL = "https://news.google.com/rss/search";

// Shape verified with a live curl of the Google News RSS search feed.
const TextNode = z.union([z.string(), z.number()]).transform(String);
const ItemSchema = z.object({
  title: TextNode,
  link: z.string().url(),
  pubDate: z.string(),
  description: TextNode.optional(),
  source: z
    .union([TextNode, z.object({ "#text": TextNode.optional() }).passthrough()])
    .optional(),
});
const FeedSchema = z.object({
  rss: z.object({
    channel: z.object({
      item: z.union([z.array(z.unknown()), z.unknown()]).optional(),
    }),
  }),
});

const parser = new XMLParser({ ignoreAttributes: true, processEntities: true, htmlEntities: true });

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function feedUrl(query: string): string {
  return `${FEED_URL}?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
}

export function parseGoogleNews(xml: string): RawItem[] {
  const feed = FeedSchema.parse(parser.parse(xml));
  const raw = feed.rss.channel.item;
  const list = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  const items: RawItem[] = [];
  for (const entry of list) {
    const parsed = ItemSchema.safeParse(entry);
    if (!parsed.success) continue;
    const { title, link, pubDate, description, source } = parsed.data;
    const sourceName = typeof source === "string" ? source : (source?.["#text"] ?? "Google News");
    const publishedAt = new Date(pubDate);
    if (Number.isNaN(publishedAt.getTime())) continue;
    // Titles end with " - Publisher"; drop it, the source is stored separately.
    const suffix = ` - ${sourceName}`;
    const cleanTitle = title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
    let snippet = description ? stripHtml(description) : "";
    if (snippet.startsWith(cleanTitle)) snippet = snippet.slice(cleanTitle.length).trim();
    if (snippet === sourceName) snippet = "";
    items.push({
      title: cleanTitle.trim(),
      url: link,
      source: sourceName,
      publishedAt: publishedAt.toISOString(),
      snippet,
    });
  }
  return items;
}

export async function fetchGoogleNews(query: string, timeoutMs: number): Promise<RawItem[]> {
  const res = await fetch(feedUrl(query), {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "User-Agent": "Mozilla/5.0 (CSR Partnership Radar)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseGoogleNews(await res.text());
}
