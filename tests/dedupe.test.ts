import { describe, expect, it } from "vitest";
import { dedupe, hashUrl, normalizeUrl } from "@/lib/pipeline/dedupe";
import type { RawItem } from "@/lib/types";

const item = (over: Partial<RawItem>): RawItem => ({
  title: "Tata Steel launches skilling programme for youth in Pune",
  url: "https://example.com/a",
  source: "Example",
  publishedAt: "2026-10-08T10:00:00.000Z",
  snippet: "",
  ...over,
});

describe("normalizeUrl", () => {
  it("strips tracking params, fragments, www and trailing slash", () => {
    expect(
      normalizeUrl("https://WWW.Example.com/news/story/?utm_source=x&utm_medium=y&id=7&fbclid=abc#top"),
    ).toBe("https://example.com/news/story?id=7");
  });

  it("strips the Google News oc param but keeps the article path", () => {
    expect(normalizeUrl("https://news.google.com/rss/articles/CBMiABC?oc=5")).toBe(
      "https://news.google.com/rss/articles/CBMiABC",
    );
  });

  it("treats the same URL with different tracking params as one item", () => {
    const out = dedupe([
      item({ url: "https://example.com/a?utm_source=news" }),
      item({ url: "https://example.com/a?utm_campaign=x", title: "Completely different headline here" }),
    ]);
    expect(out).toHaveLength(1);
  });

  it("returns invalid URLs unchanged", () => {
    expect(normalizeUrl("not a url")).toBe("not a url");
  });
});

describe("title-similarity merge", () => {
  it("merges near-identical titles (Jaccard >= 0.6) and keeps the earliest", () => {
    const out = dedupe([
      item({ url: "https://b.com/1", publishedAt: "2026-10-09T10:00:00.000Z", source: "B" }),
      item({
        url: "https://a.com/1",
        title: "Tata Steel launches new skilling programme for youth in Pune",
        publishedAt: "2026-10-07T10:00:00.000Z",
        source: "A",
      }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("A");
  });

  it("keeps different stories apart", () => {
    const out = dedupe([
      item({ url: "https://a.com/1" }),
      item({ url: "https://a.com/2", title: "MCA notifies amendment to CSR rules under Schedule VII" }),
    ]);
    expect(out).toHaveLength(2);
  });
});

describe("previously sent URLs", () => {
  it("drops items whose URL hash was in an earlier digest", () => {
    const sent = new Set([hashUrl(normalizeUrl("https://a.com/old?utm_source=mail"))]);
    const out = dedupe(
      [
        item({ url: "https://a.com/old" }),
        item({ url: "https://a.com/new", title: "Infosys Foundation seeks NGO partners for digital literacy" }),
      ],
      sent,
    );
    expect(out.map((i) => i.url)).toEqual(["https://a.com/new"]);
  });

  it("caps the result", () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      item({ url: `https://a.com/${i}`, title: `unique story number ${i} word${i}a word${i}b word${i}c` }),
    );
    expect(dedupe(many)).toHaveLength(60);
  });
});
