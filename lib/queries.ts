import { db } from "./supabase";
import type { DigestItemRow, DigestRow } from "./types";

const DIGEST_COLUMNS = "id, week_start, created_at, trigger, status, source_status, counts, email_sent";

export async function listDigests(limit = 52): Promise<DigestRow[]> {
  const { data, error } = await db()
    .from("digests")
    .select(DIGEST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as DigestRow[];
}

export async function getLatestDigest(): Promise<DigestRow | null> {
  return (await listDigests(1))[0] ?? null;
}

export async function getDigest(id: string): Promise<DigestRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db().from("digests").select(DIGEST_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as DigestRow | null;
}

const VERDICT_RANK = { call: 0, watch: 1, skip: 2 } as const;

export async function getDigestItems(digestId: string): Promise<DigestItemRow[]> {
  const { data, error } = await db().from("digest_items").select("*").eq("digest_id", digestId);
  if (error) throw new Error(error.message);
  return ((data ?? []) as DigestItemRow[]).sort(
    (a, b) =>
      VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] ||
      (a.priority ?? 5) - (b.priority ?? 5) ||
      (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  );
}
