import { NextResponse } from "next/server";
import { isValidPasscode } from "@/lib/auth";
import { runDigest } from "@/lib/pipeline/runDigest";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isValidPasscode(request.headers.get("x-admin-passcode"), process.env.ADMIN_PASSCODE)) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }
  try {
    const result = await runDigest("manual");
    const { items: _items, ...summary } = result;
    void _items;
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[manual run] digest failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
