import { db } from "../supabase";
import type { AnalysedItem, DigestCounts, DigestRow, SourceStatus } from "../types";

/** Returns the url hashes (out of `hashes`) already stored in earlier digests. */
export async function findSentHashes(hashes: string[]): Promise<Set<string>> {
  if (hashes.length === 0) return new Set();
  const { data, error } = await db().from("digest_items").select("url_hash").in("url_hash", hashes);
  if (error) throw new Error(`Could not read earlier digests: ${error.message}`);
  return new Set((data ?? []).map((row: { url_hash: string }) => row.url_hash));
}

export async function saveDigest(input: {
  weekStart: string;
  trigger: DigestRow["trigger"];
  status: DigestRow["status"];
  sourceStatus: SourceStatus;
  counts: DigestCounts;
  items: AnalysedItem[];
}): Promise<string> {
  const { data, error } = await db()
    .from("digests")
    .insert({
      week_start: input.weekStart,
      trigger: input.trigger,
      status: input.status,
      source_status: input.sourceStatus,
      counts: input.counts,
      email_sent: false,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Could not save digest: ${error?.message}`);
  const digestId = (data as { id: string }).id;

  if (input.items.length) {
    const rows = input.items.map((item) => ({
      digest_id: digestId,
      url: item.url,
      url_hash: item.urlHash,
      title: item.title,
      source: item.source,
      published_at: item.publishedAt,
      signal_type: item.signal_type,
      company: item.company,
      sector: item.sector,
      region: item.region,
      summary: item.summary,
      why_it_matters: item.why_it_matters,
      verdict: item.verdict,
      reason: item.reason,
      priority: item.priority,
    }));
    const { error: itemsError } = await db().from("digest_items").insert(rows);
    if (itemsError) throw new Error(`Could not save digest items: ${itemsError.message}`);
  }
  return digestId;
}

export async function markEmailSent(digestId: string): Promise<void> {
  const { error } = await db().from("digests").update({ email_sent: true }).eq("id", digestId);
  if (error) throw new Error(`Could not mark email sent: ${error.message}`);
}
