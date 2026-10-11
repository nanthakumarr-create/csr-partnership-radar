import Link from "next/link";
import { connection } from "next/server";
import { formatDate } from "@/lib/dates";
import { listDigests } from "@/lib/queries";

const STATUS_STYLE = {
  success: "text-green-800",
  partial: "text-amber-800",
  failed: "text-red-700",
} as const;

export default async function DigestsPage() {
  await connection();
  const digests = await listDigests();

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Past digests</h1>
      {digests.length === 0 ? (
        <p className="mt-4 text-gray-700">
          No digests yet. Run one from{" "}
          <Link href="/settings" className="text-accent underline">
            Settings
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 rounded-[6px] border border-gray-200">
          {digests.map((d) => (
            <li key={d.id} className="border-b border-gray-200 last:border-b-0">
              <Link
                href={`/digests/${d.id}`}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">
                  Week of {formatDate(d.week_start)}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    run {formatDate(d.created_at)} ({d.trigger})
                  </span>
                </span>
                <span className="text-sm text-gray-700">
                  {d.counts?.call ?? 0} call · {d.counts?.watch ?? 0} watch · {d.counts?.skip ?? 0} skip ·{" "}
                  <span className={STATUS_STYLE[d.status]}>{d.status}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
