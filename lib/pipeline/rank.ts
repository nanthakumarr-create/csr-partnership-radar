import type { AnalysedItem, Verdict } from "../types";

const VERDICT_ORDER: Record<Verdict, number> = { call: 0, watch: 1, skip: 2 };

/** call > watch > skip, then priority (1 = most urgent), then most recent first. */
export function rank(items: AnalysedItem[]): AnalysedItem[] {
  return [...items].sort(
    (a, b) =>
      VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] ||
      a.priority - b.priority ||
      b.publishedAt.localeCompare(a.publishedAt),
  );
}
