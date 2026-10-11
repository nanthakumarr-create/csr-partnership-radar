import { GoogleGenAI, ThinkingLevel, Type, type Schema, type ThinkingConfig } from "@google/genai";
import { z } from "zod";
import { geminiModel, requireEnv } from "../env";
import { SIGNAL_TYPES, VERDICTS, type AnalysedItem, type DedupedItem, type Settings } from "../types";

export const BATCH_SIZE = 15;
const BATCH_DELAY_MS = 500;
const CALL_TIMEOUT_MS = 20000;

// Zod schema for Gemini output. Every response is validated against it.
const AnalysisItemSchema = z.object({
  index: z.number().int().nonnegative(),
  signal_type: z.enum(SIGNAL_TYPES).nullable(),
  company: z.string().trim().min(1).nullable(),
  sector: z.string().trim().min(1).nullable(),
  region: z.string().trim().min(1).nullable(),
  summary: z.string().trim().min(1),
  why_it_matters: z.string().trim(),
  verdict: z.enum(VERDICTS),
  reason: z.string().trim().min(1),
  priority: z.number().int().min(1).max(5),
});
export const GeminiResponseSchema = z.object({ items: z.array(AnalysisItemSchema) });
export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;

/** Parses raw Gemini text. Returns null on invalid JSON or schema mismatch. */
export function parseGeminiResponse(text: string | undefined): GeminiResponse | null {
  if (!text) return null;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = GeminiResponseSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

// Same shape, expressed as a Gemini response schema (structured output).
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          signal_type: { type: Type.STRING, enum: [...SIGNAL_TYPES], nullable: true },
          company: { type: Type.STRING, nullable: true },
          sector: { type: Type.STRING, nullable: true },
          region: { type: Type.STRING, nullable: true },
          summary: { type: Type.STRING },
          why_it_matters: { type: Type.STRING },
          verdict: { type: Type.STRING, enum: [...VERDICTS] },
          reason: { type: Type.STRING },
          priority: { type: Type.INTEGER },
        },
        required: [
          "index",
          "signal_type",
          "company",
          "sector",
          "region",
          "summary",
          "why_it_matters",
          "verdict",
          "reason",
          "priority",
        ],
        propertyOrdering: [
          "index",
          "signal_type",
          "company",
          "sector",
          "region",
          "verdict",
          "priority",
          "summary",
          "why_it_matters",
          "reason",
        ],
      },
    },
  },
  required: ["items"],
};

export function buildPrompt(items: DedupedItem[], settings: Pick<Settings, "sectors" | "regions">): string {
  const list = items.map((item, i) => ({
    index: i,
    title: item.title,
    snippet: item.snippet,
    source: item.source,
    date: item.publishedAt.slice(0, 10),
  }));
  return `You screen news for Ananya, Head of Corporate Partnerships at a Pune-based education NGO running skilling programmes for school dropouts and first-generation job seekers. For each item decide: "Is this worth a call this week?"

Her focus sectors: ${settings.sectors.join(", ") || "none set"}.
Her focus regions: ${settings.regions.join(", ") || "none set"}.

Signal types:
- new_initiative: a company announces a new CSR initiative in her sectors.
- increased_allocation: a company signals higher CSR spend.
- partner_search: a company is explicitly looking for NGO or implementation partners.
- policy_change: a policy or regulatory change affecting how companies deploy CSR funds (Companies Act Schedule VII, CSR rules, MCA notifications and similar).

Strict rules:
- Use only the given title, snippet, source and date. Do not add facts from elsewhere.
- If the company or amount is unknown, return null. Do not guess.
- If no signal type clearly applies, set signal_type to null.
- Return verdict "skip" for anything not clearly relevant to her sectors and CSR funding.
- verdict "call": a concrete, timely opening she should act on this week. "watch": relevant but not yet actionable.
- priority: 1 = most urgent, 5 = least.
- summary: one to two plain sentences. why_it_matters: one sentence for her NGO (empty string for skip). reason: one short sentence answering "Call this week?".
- Return exactly one entry per input item, using its index.

Items (JSON):
${JSON.stringify(list)}`;
}

// Keep thinking minimal so the run fits the 60s function limit.
// Gemini 2.x takes a token budget; Gemini 3+ takes a level.
function thinkingConfig(model: string): ThinkingConfig {
  return /^gemini-2\./.test(model) ? { thinkingBudget: 0 } : { thinkingLevel: ThinkingLevel.LOW };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type AnalyseResult = { items: AnalysedItem[]; failed: number; error?: string };

/** Sends items to Gemini in sequential batches; invalid output is retried once, then the batch is marked failed. */
export async function analyse(
  items: DedupedItem[],
  settings: Pick<Settings, "sectors" | "regions">,
  { deadline = Infinity }: { deadline?: number } = {},
): Promise<AnalyseResult> {
  if (items.length === 0) return { items: [], failed: 0 };

  let ai: GoogleGenAI;
  try {
    ai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[analyse] ${error}`);
    return { items: [], failed: items.length, error };
  }

  const out: AnalysedItem[] = [];
  let failed = 0;
  let lastError: string | undefined;

  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    if (start > 0) await sleep(BATCH_DELAY_MS);
    const batch = items.slice(start, start + BATCH_SIZE);
    // Stop before the function limit rather than lose the whole run.
    if (Date.now() + CALL_TIMEOUT_MS > deadline) {
      lastError = "Stopped early to stay within the function time limit";
      failed += items.length - start;
      break;
    }
    let parsed: GeminiResponse | null = null;

    for (let attempt = 1; attempt <= 2 && !parsed; attempt++) {
      try {
        const model = geminiModel();
        const response = await ai.models.generateContent({
          model,
          contents: buildPrompt(batch, settings),
          config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.2,
            thinkingConfig: thinkingConfig(model),
            abortSignal: AbortSignal.timeout(CALL_TIMEOUT_MS),
          },
        });
        parsed = parseGeminiResponse(response.text);
        if (!parsed) lastError = "Gemini returned JSON that failed validation";
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      if (!parsed) console.error(`[analyse] batch ${start / BATCH_SIZE + 1} attempt ${attempt} failed: ${lastError}`);
    }

    if (!parsed) {
      failed += batch.length;
      continue;
    }

    const seen = new Set<number>();
    for (const result of parsed.items) {
      const source = batch[result.index];
      if (!source || seen.has(result.index)) continue;
      seen.add(result.index);
      const { index: _index, ...analysis } = result;
      void _index;
      out.push({ ...source, ...analysis });
    }
    failed += batch.length - seen.size;
  }

  return { items: out, failed, ...(lastError && failed ? { error: lastError } : {}) };
}
