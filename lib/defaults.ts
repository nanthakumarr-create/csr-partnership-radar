import type { Settings } from "./types";

/** Defaults from the brief; also seeded by supabase/schema.sql. */
export const DEFAULT_SETTINGS: Settings = {
  sectors: ["education", "skill development", "digital literacy", "youth employment"],
  regions: ["Maharashtra", "Pune", "Pan-India"],
  extra_keywords: [],
  recipient_email: "",
};
