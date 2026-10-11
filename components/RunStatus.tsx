import { connection } from "next/server";
import { formatDateTime, nextCronRun } from "@/lib/dates";
import { getLatestDigest } from "@/lib/queries";
import { StatusBadge } from "./ui";

/** Sidebar panel: when the next digest goes out and how the last one went. */
export async function RunStatus() {
  await connection();
  const next = nextCronRun();
  let latest = null;
  try {
    latest = await getLatestDigest();
  } catch {
    latest = null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-canvas p-3 text-[13px]">
      <div>
        <p className="text-ink-3">Next digest</p>
        <p className="font-medium text-ink">
          {next.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}, 06:30 IST
        </p>
      </div>
      <div>
        <p className="text-ink-3">Last run</p>
        {latest ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{formatDateTime(latest.created_at)}</span>
            <StatusBadge status={latest.status} />
          </div>
        ) : (
          <p className="font-medium text-ink">No runs yet</p>
        )}
      </div>
    </div>
  );
}
