import { z } from "zod";

export const SIGNAL_TYPES = [
  "new_initiative",
  "increased_allocation",
  "partner_search",
  "policy_change",
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const SIGNAL_LABELS: Record<SignalType, string> = {
  new_initiative: "New initiative",
  increased_allocation: "Increased allocation",
  partner_search: "Partner search",
  policy_change: "Policy change",
};

export const VERDICTS = ["call", "watch", "skip"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const SettingsSchema = z.object({
  sectors: z.array(z.string()),
  regions: z.array(z.string()),
  extra_keywords: z.array(z.string()),
  recipient_email: z.string(),
  updated_at: z.string().optional(),
});
export type Settings = z.infer<typeof SettingsSchema>;

/** One normalised article from any source. publishedAt is an ISO string. */
export type RawItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
};

export type DedupedItem = RawItem & { urlHash: string };

/** Fields Gemini returns for each item. */
export type Analysis = {
  signal_type: SignalType | null;
  company: string | null;
  sector: string | null;
  region: string | null;
  summary: string;
  why_it_matters: string;
  verdict: Verdict;
  reason: string;
  priority: number;
};

export type AnalysedItem = DedupedItem & Analysis;

export type SourceStatus = Record<
  string,
  { status: "ok" | "error"; count: number; error?: string }
>;

export type DigestCounts = {
  fetched: number;
  after_dedup: number;
  call: number;
  watch: number;
  skip: number;
  failed: number;
};

export type DigestRow = {
  id: string;
  week_start: string;
  created_at: string;
  trigger: "cron" | "manual";
  status: "success" | "partial" | "failed";
  source_status: SourceStatus;
  counts: DigestCounts;
  email_sent: boolean;
};

export type DigestItemRow = {
  id: string;
  digest_id: string;
  url: string;
  url_hash: string;
  title: string;
  source: string;
  published_at: string | null;
  signal_type: SignalType | null;
  company: string | null;
  sector: string | null;
  region: string | null;
  summary: string | null;
  why_it_matters: string | null;
  verdict: Verdict;
  reason: string | null;
  priority: number | null;
};
