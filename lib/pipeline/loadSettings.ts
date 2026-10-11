import { db } from "../supabase";
import { SettingsSchema, type Settings } from "../types";

export async function loadSettings(): Promise<Settings> {
  const { data, error } = await db()
    .from("settings")
    .select("sectors, regions, extra_keywords, recipient_email, updated_at")
    .eq("id", 1)
    .single();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  return SettingsSchema.parse(data);
}
