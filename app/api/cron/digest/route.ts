import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/auth";
import { runDigest } from "@/lib/pipeline/runDigest";

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDigest("cron");
    const { items: _items, ...summary } = result;
    void _items;
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[cron] digest failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
