import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/dates";
import { loadSettings } from "@/lib/pipeline/loadSettings";
import { getDigestItems } from "@/lib/queries";
import type { DigestRow } from "@/lib/types";
import { Triage } from "./Triage";
import { Card, PageHeader, StatTile, StatusBadge } from "./ui";

const SOURCE_NAMES: Record<string, string> = { google_news: "Google News" };

function RunHealth({ digest }: { digest: DigestRow }) {
  const c = digest.counts;
  const analysed = (c?.call ?? 0) + (c?.watch ?? 0) + (c?.skip ?? 0);
  const steps = [
    { label: "Articles fetched", value: c?.fetched ?? 0 },
    { label: "Unique, not sent before", value: c?.after_dedup ?? 0 },
    { label: "Analysed by Gemini", value: analysed },
    { label: "Worth a call or watch", value: (c?.call ?? 0) + (c?.watch ?? 0) },
  ];
  return (
    <Card title="Run health" description={`${digest.trigger === "cron" ? "Scheduled" : "Manual"} run, ${formatDateTime(digest.created_at)} IST`}>
      <ol className="space-y-2.5 text-[13px]">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-ink-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-canvas text-[11px] font-semibold text-ink-3">
                {i + 1}
              </span>
              {s.label}
            </span>
            <span className="font-semibold text-ink tabular-nums">{s.value}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 space-y-2 border-t border-line pt-3 text-[13px]">
        {Object.entries(digest.source_status ?? {}).map(([name, s]) => (
          <p key={name} className="flex items-center justify-between gap-2">
            <span className="text-ink-2">{SOURCE_NAMES[name] ?? name}</span>
            <span className={s.status === "ok" ? "font-medium text-call" : "font-medium text-danger"}>
              {s.status === "ok" ? `OK · ${s.count} items` : "Error"}
            </span>
          </p>
        ))}
        <p className="flex items-center justify-between gap-2">
          <span className="text-ink-2">Email digest</span>
          <span className={digest.email_sent ? "font-medium text-call" : "font-medium text-watch"}>
            {digest.email_sent ? "Sent" : "Not sent"}
          </span>
        </p>
        {(c?.failed ?? 0) > 0 && (
          <p className="rounded-md bg-watch-soft px-2.5 py-2 text-watch">
            {c.failed} item{c.failed === 1 ? "" : "s"} could not be analysed and are not shown. They will be retried next week.
          </p>
        )}
        {Object.values(digest.source_status ?? {})
          .filter((s) => s.status === "error" && s.error)
          .map((s) => (
            <p key={s.error} className="rounded-md bg-danger-soft px-2.5 py-2 text-danger">
              {s.error}
            </p>
          ))}
      </div>
    </Card>
  );
}

async function FocusCard() {
  const settings = await loadSettings().catch(() => null);
  if (!settings) return null;
  return (
    <Card
      title="Focus"
      action={
        <Link href="/settings" className="text-[13px] font-medium text-accent hover:underline">
          Edit
        </Link>
      }
    >
      <div className="space-y-3 text-[13px]">
        {[
          { label: "Sectors", values: settings.sectors },
          { label: "Regions", values: settings.regions },
          { label: "Extra keywords", values: settings.extra_keywords },
        ]
          .filter((g) => g.values.length)
          .map((g) => (
            <div key={g.label}>
              <p className="text-ink-3">{g.label}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {g.values.map((v) => (
                  <span key={v} className="rounded-md bg-canvas px-2 py-0.5 text-ink-2">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

export async function DigestView({ digest, eyebrow }: { digest: DigestRow; eyebrow: string }) {
  const items = await getDigestItems(digest.id);
  const call = items.filter((i) => i.verdict === "call").length;
  const watch = items.filter((i) => i.verdict === "watch").length;
  const policy = items.filter((i) => i.signal_type === "policy_change" && i.verdict !== "skip").length;
  const partners = items.filter((i) => i.signal_type === "partner_search" && i.verdict !== "skip").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={`Week of ${formatDate(digest.week_start)}`}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={digest.status} />
            <span>
              Generated {formatDateTime(digest.created_at)} IST · {digest.trigger === "cron" ? "scheduled" : "manual"} run
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="To call this week" value={call} tone="call" hint="Concrete openings to act on" />
        <StatTile label="To watch" value={watch} tone="watch" hint="Relevant, not yet actionable" />
        <StatTile label="Partner searches" value={partners} tone="accent" hint={`${policy} policy update${policy === 1 ? "" : "s"}`} />
        <StatTile
          label="Articles scanned"
          value={digest.counts?.fetched ?? 0}
          hint={`${digest.counts?.after_dedup ?? 0} unique after de-duplication`}
        />
      </div>

      {items.length ? (
        <Triage
          items={items}
          rail={
            <>
              <RunHealth digest={digest} />
              <FocusCard />
            </>
          }
        />
      ) : (
        <div className="rounded-lg border border-dashed border-line-strong bg-white px-6 py-12 text-center text-sm text-ink-2">
          This digest has no items.
        </div>
      )}
    </div>
  );
}
