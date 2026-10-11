import { filterLast7Days } from "../dates";
import { fetchGoogleNews } from "../sources/googleNews";
import type { RawItem, SourceStatus } from "../types";

const TIMEOUT_MS = 8000;

export type FetchResult = { items: RawItem[]; sourceStatus: SourceStatus };

/** Fetches every query from every source in parallel. A failing source is logged and recorded, never faked. */
export async function fetchSources(queries: string[], now: Date = new Date()): Promise<FetchResult> {
  const sourceStatus: SourceStatus = {};
  const items: RawItem[] = [];

  const results = await Promise.allSettled(queries.map((q) => fetchGoogleNews(q, TIMEOUT_MS)));
  const errors: string[] = [];
  let count = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      count += r.value.length;
      items.push(...r.value);
    } else {
      const message = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`[fetchSources] google_news query failed: ${queries[i]} -> ${message}`);
      errors.push(message);
    }
  });
  const allFailed = errors.length === queries.length;
  sourceStatus.google_news = {
    status: allFailed ? "error" : "ok",
    count,
    ...(errors.length ? { error: `${errors.length}/${queries.length} queries failed: ${errors[0]}` } : {}),
  };

  return { items: filterLast7Days(items, now), sourceStatus };
}
