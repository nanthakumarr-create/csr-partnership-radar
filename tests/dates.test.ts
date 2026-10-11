import { describe, expect, it } from "vitest";
import { filterLast7Days } from "@/lib/dates";

describe("filterLast7Days", () => {
  const now = new Date("2026-10-12T01:00:00.000Z");
  const at = (iso: string) => ({ publishedAt: iso });

  it("keeps items from the last 7 days", () => {
    const items = [at("2026-10-11T12:00:00.000Z"), at("2026-10-05T02:00:00.000Z")];
    expect(filterLast7Days(items, now)).toHaveLength(2);
  });

  it("drops items older than 7 days", () => {
    expect(filterLast7Days([at("2026-10-04T23:59:00.000Z")], now)).toHaveLength(0);
  });

  it("drops items dated in the future and unparseable dates", () => {
    expect(filterLast7Days([at("2026-10-14T00:00:00.000Z"), at("not a date")], now)).toHaveLength(0);
  });
});
