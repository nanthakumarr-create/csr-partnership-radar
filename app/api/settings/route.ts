import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidPasscode } from "@/lib/auth";
import { loadSettings } from "@/lib/pipeline/loadSettings";
import { db } from "@/lib/supabase";

const List = z.array(z.string().trim().min(1).max(60)).max(20);
const SettingsInput = z.object({
  sectors: List.min(1, "Add at least one sector"),
  regions: List.min(1, "Add at least one region"),
  extra_keywords: List,
  recipient_email: z.email("Enter a valid email address"),
});

export async function GET() {
  try {
    return NextResponse.json(await loadSettings());
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isValidPasscode(request.headers.get("x-admin-passcode"), process.env.ADMIN_PASSCODE)) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const parsed = SettingsInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
  }
  const dedupe = (list: string[]) => [...new Set(list)];
  const { error } = await db()
    .from("settings")
    .update({
      sectors: dedupe(parsed.data.sectors),
      regions: dedupe(parsed.data.regions),
      extra_keywords: dedupe(parsed.data.extra_keywords),
      recipient_email: parsed.data.recipient_email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(await loadSettings());
}
