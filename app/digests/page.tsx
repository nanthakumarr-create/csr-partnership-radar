import Link from "next/link";
import { connection } from "next/server";
import { TrendChart } from "@/components/TrendChart";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/dates";
import { listDigests } from "@/lib/queries";

export default async function DigestsPage() {
  await connection();
  const digests = await listDigests();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="Past digests"
        meta={`${digests.length} digest${digests.length === 1 ? "" : "s"} so far. Each item is sent only once, so every digest holds new stories.`}
      />

      {digests.length === 0 ? (
        <EmptyState title="No digests yet">
          <Link href="/settings" className="font-medium text-accent underline">
            Run one from Settings
          </Link>{" "}
          or wait for Monday 06:30 IST.
        </EmptyState>
      ) : (
        <>
          <Card title="Weekly trend" description="Items worth a call or a watch, per digest">
            <TrendChart digests={digests} />
          </Card>

          <Card title="All digests">
            <div className="-mx-5 -my-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-xs font-semibold tracking-wide text-ink-3 uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-3 sm:px-5">Week</th>
                    <th scope="col" className="hidden px-3 py-3 md:table-cell">Generated</th>
                    <th scope="col" className="px-2 py-3 text-right sm:px-3">Call</th>
                    <th scope="col" className="px-2 py-3 text-right sm:px-3">Watch</th>
                    <th scope="col" className="hidden px-3 py-3 text-right sm:table-cell">Skip</th>
                    <th scope="col" className="hidden px-3 py-3 text-right md:table-cell">Scanned</th>
                    <th scope="col" className="hidden px-3 py-3 sm:table-cell">Email</th>
                    <th scope="col" className="px-3 py-3 sm:px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {digests.map((d) => (
                    <tr key={d.id} className="relative hover:bg-canvas">
                      <td className="px-3 py-3 font-medium whitespace-nowrap text-ink sm:px-5">
                        <Link href={`/digests/${d.id}`} className="after:absolute after:inset-0 hover:text-accent">
                          {formatDate(d.week_start)}
                        </Link>
                      </td>
                      <td className="hidden px-3 py-3 whitespace-nowrap text-ink-2 md:table-cell">
                        {formatDateTime(d.created_at)} · {d.trigger === "cron" ? "scheduled" : "manual"}
                      </td>
                      <td className="px-2 py-3 text-right font-semibold text-call tabular-nums sm:px-3">{d.counts?.call ?? 0}</td>
                      <td className="px-2 py-3 text-right font-semibold text-watch tabular-nums sm:px-3">{d.counts?.watch ?? 0}</td>
                      <td className="hidden px-3 py-3 text-right text-ink-2 tabular-nums sm:table-cell">{d.counts?.skip ?? 0}</td>
                      <td className="hidden px-3 py-3 text-right text-ink-2 tabular-nums md:table-cell">{d.counts?.fetched ?? 0}</td>
                      <td className="hidden px-3 py-3 text-ink-2 sm:table-cell">{d.email_sent ? "Sent" : "Not sent"}</td>
                      <td className="px-3 py-3 sm:px-5">
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
