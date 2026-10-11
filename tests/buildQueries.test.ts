import { describe, expect, it } from "vitest";
import { buildQueries, MAX_QUERIES } from "@/lib/pipeline/buildQueries";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

describe("buildQueries", () => {
  it("builds queries from the default settings, all limited to 7 days", () => {
    const queries = buildQueries(DEFAULT_SETTINGS);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.length).toBeLessThanOrEqual(MAX_QUERIES);
    expect(queries.every((q) => q.endsWith(" when:7d"))).toBe(true);
    expect(queries.some((q) => q.includes('"skill development"'))).toBe(true);
    expect(queries.some((q) => q.includes('"Pune"'))).toBe(true);
    expect(queries.some((q) => q.includes("Pan-India"))).toBe(false);
  });

  it("respects edited settings", () => {
    const queries = buildQueries({ sectors: ["healthcare"], regions: ["Nagpur"], extra_keywords: ["Tata Trusts"] });
    expect(queries.some((q) => q.includes('"healthcare"'))).toBe(true);
    expect(queries.some((q) => q.includes('"Nagpur"'))).toBe(true);
    expect(queries.some((q) => q.includes('"Tata Trusts"'))).toBe(true);
    expect(queries.some((q) => q.includes('"education"'))).toBe(false);
  });

  it("never exceeds 12 queries", () => {
    const many = (p: string) => Array.from({ length: 20 }, (_, i) => `${p}${i}`);
    const queries = buildQueries({ sectors: many("sector"), regions: many("region"), extra_keywords: many("kw") });
    expect(queries).toHaveLength(MAX_QUERIES);
  });
});
