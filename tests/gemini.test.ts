import { describe, expect, it } from "vitest";
import { parseGeminiResponse } from "@/lib/pipeline/analyse";

const validItem = {
  index: 0,
  signal_type: "partner_search",
  company: "Infosys Foundation",
  sector: "digital literacy",
  region: "Maharashtra",
  summary: "Infosys Foundation invites NGOs to apply as implementation partners.",
  why_it_matters: "Direct opening for a skilling NGO in Pune.",
  verdict: "call",
  reason: "Applications are open now.",
  priority: 1,
};

describe("parseGeminiResponse", () => {
  it("accepts a valid response, including null company", () => {
    const text = JSON.stringify({ items: [validItem, { ...validItem, index: 1, company: null, verdict: "skip" }] });
    const parsed = parseGeminiResponse(text);
    expect(parsed?.items).toHaveLength(2);
    expect(parsed?.items[1].company).toBeNull();
  });

  it("rejects malformed JSON", () => {
    expect(parseGeminiResponse('{"items": [ {"index": 0,')).toBeNull();
    expect(parseGeminiResponse(undefined)).toBeNull();
  });

  it("rejects items with missing fields", () => {
    const { verdict: _v, reason: _r, ...missing } = validItem;
    void _v;
    void _r;
    expect(parseGeminiResponse(JSON.stringify({ items: [missing] }))).toBeNull();
  });

  it("rejects values outside the allowed set", () => {
    expect(parseGeminiResponse(JSON.stringify({ items: [{ ...validItem, verdict: "maybe" }] }))).toBeNull();
    expect(parseGeminiResponse(JSON.stringify({ items: [{ ...validItem, priority: 9 }] }))).toBeNull();
  });
});
