import { formatDate } from "@/lib/dates";
import { getDigestItems } from "@/lib/queries";
import type { DigestRow } from "@/lib/types";
import { ItemList } from "./ItemList";

const STATUS_TEXT: Record<DigestRow["status"], string> = {
  success: "Last run succeeded",
  partial: "Last run partly succeeded",
  failed: "Last run failed",
};

export async function DigestView({ digest }: { digest: DigestRow }) {
  const items = await getDigestItems(digest.id);
  const call = items.filter((i) => i.verdict === "call").length;
  const watch = items.filter((i) => i.verdict === "watch").length;
  const sourceProblems = Object.entries(digest.source_status ?? {}).filter(([, s]) => s.status === "error");
  const failed = digest.counts?.failed ?? 0;

  return (
    <article>
      <h1 className="text-xl font-semibold text-gray-900">
        Week of {formatDate(digest.week_start)} · {call} to call · {watch} to watch
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {STATUS_TEXT[digest.status]} on {formatDate(digest.created_at)} ({digest.trigger}) ·{" "}
        {digest.counts?.fetched ?? 0} articles fetched, {digest.counts?.after_dedup ?? 0} after removing duplicates ·
        email {digest.email_sent ? "sent" : "not sent"}
      </p>
      {(sourceProblems.length > 0 || failed > 0) && (
        <p className="mt-2 rounded-[6px] border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {sourceProblems.map(([name, s]) => `${name}: ${s.error ?? "error"}. `).join("")}
          {failed > 0 && `${failed} item${failed === 1 ? "" : "s"} could not be analysed and are not shown.`}
        </p>
      )}
      <div className="mt-6">
        {items.length ? (
          <ItemList items={items} />
        ) : (
          <p className="text-gray-600">This digest has no items.</p>
        )}
      </div>
    </article>
  );
}
