import { weekStartIST } from "../dates";
import { DEFAULT_SETTINGS } from "../defaults";
import type { AnalysedItem, DigestCounts, DigestRow, Settings, SourceStatus } from "../types";
import { analyse } from "./analyse";
import { buildQueries } from "./buildQueries";
import { dedupe } from "./dedupe";
import { fetchSources } from "./fetchSources";
import { loadSettings } from "./loadSettings";
import { rank } from "./rank";
import { findSentHashes, markEmailSent, saveDigest } from "./save";
import { sendEmail } from "./sendEmail";

export type RunResult = {
  digestId: string | null;
  status: DigestRow["status"];
  counts: DigestCounts;
  sourceStatus: SourceStatus;
  emailSent: boolean;
  items: AnalysedItem[];
  errors: string[];
};

const hasDb = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Orchestrates one digest run. With dryRun the pipeline runs against live sources
 * and Gemini but writes nothing and sends no email.
 */
export async function runDigest(
  trigger: DigestRow["trigger"],
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<RunResult> {
  const errors: string[] = [];
  const now = new Date();
  // Leave room for save + email inside the 60s function limit.
  const deadline = now.getTime() + 55_000;

  let settings: Settings;
  if (dryRun && !hasDb()) {
    settings = DEFAULT_SETTINGS;
    errors.push("Supabase not configured; dry run used default settings and skipped the already-sent check");
  } else {
    settings = await loadSettings();
  }

  const queries = buildQueries(settings);
  const { items: fetched, sourceStatus } = await fetchSources(queries, now);

  // Exact URL dedupe + title merge first, then look up which of the survivors were sent before.
  const candidates = dedupe(fetched, new Set(), Number.MAX_SAFE_INTEGER);
  const sent = dryRun && !hasDb() ? new Set<string>() : await findSentHashes(candidates.map((i) => i.urlHash));
  const deduped = dedupe(fetched, sent);

  const analysed = await analyse(deduped, settings, { deadline });
  if (analysed.error) errors.push(`Analysis: ${analysed.error}`);
  const items = rank(analysed.items);

  const counts: DigestCounts = {
    fetched: fetched.length,
    after_dedup: deduped.length,
    call: items.filter((i) => i.verdict === "call").length,
    watch: items.filter((i) => i.verdict === "watch").length,
    skip: items.filter((i) => i.verdict === "skip").length,
    failed: analysed.failed,
  };

  const sourceFailed = Object.values(sourceStatus).some((s) => s.status === "error");
  const allSourcesFailed = Object.values(sourceStatus).every((s) => s.status === "error");
  const status: DigestRow["status"] =
    allSourcesFailed || (deduped.length > 0 && items.length === 0)
      ? "failed"
      : sourceFailed || analysed.failed > 0
        ? "partial"
        : "success";

  if (dryRun) {
    return { digestId: null, status, counts, sourceStatus, emailSent: false, items, errors };
  }

  const weekStart = weekStartIST(now);
  let emailSent = false;
  const digestId = await saveDigest({ weekStart, trigger, status, sourceStatus, counts, items });

  if (!settings.recipient_email) {
    errors.push("No recipient email set; email not sent");
  } else if (status !== "failed") {
    try {
      await sendEmail({ to: settings.recipient_email, items, weekStart, digestId });
      await markEmailSent(digestId);
      emailSent = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[runDigest] email failed: ${message}`);
      errors.push(`Email: ${message}`);
    }
  }
  return { digestId, status, counts, sourceStatus, emailSent, items, errors };
}
