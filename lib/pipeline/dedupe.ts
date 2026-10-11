import { createHash } from "node:crypto";
import type { DedupedItem, RawItem } from "../types";

export const MAX_ITEMS = 60;
export const TITLE_SIMILARITY = 0.6;

const TRACKING_PARAMS = /^(utm_.*|fbclid|gclid|mc_cid|mc_eid|ocid|oc|ref|ref_src|cmpid|igshid|hl|gl|ceid)$/i;

/** Lower-cases host, strips tracking params, fragments and trailing slashes. */
export function normalizeUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return input.trim();
  }
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function hashUrl(normalizedUrl: string): string {
  return createHash("sha256").update(normalizedUrl).digest("hex");
}

export function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * 1. Normalise URLs and drop exact URL duplicates.
 * 2. Merge stories whose titles have token Jaccard >= 0.6, keeping the earliest.
 * 3. Drop URLs already sent in earlier digests.
 * 4. Cap at `cap` items (most recent first).
 */
export function dedupe(
  items: RawItem[],
  alreadySent: Set<string> = new Set(),
  cap: number = MAX_ITEMS,
): DedupedItem[] {
  const byUrl = new Map<string, DedupedItem>();
  for (const item of items) {
    const url = normalizeUrl(item.url);
    const urlHash = hashUrl(url);
    const existing = byUrl.get(urlHash);
    if (!existing || item.publishedAt < existing.publishedAt) {
      byUrl.set(urlHash, { ...item, url, urlHash });
    }
  }

  const sorted = [...byUrl.values()].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const kept: { item: DedupedItem; tokens: Set<string> }[] = [];
  for (const item of sorted) {
    const tokens = titleTokens(item.title);
    if (kept.some((k) => jaccard(k.tokens, tokens) >= TITLE_SIMILARITY)) continue;
    kept.push({ item, tokens });
  }

  return kept
    .map((k) => k.item)
    .filter((item) => !alreadySent.has(item.urlHash))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, cap);
}
