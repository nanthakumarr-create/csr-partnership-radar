import { formatDate } from "@/lib/dates";
import type { DigestRow } from "@/lib/types";

const PLOT_HEIGHT = 140;

/** Grouped columns: call vs watch per digest run, oldest to newest. */
export function TrendChart({ digests }: { digests: DigestRow[] }) {
  const runs = [...digests].slice(0, 12).reverse();
  const max = Math.max(1, ...runs.flatMap((d) => [d.counts?.call ?? 0, d.counts?.watch ?? 0]));
  const height = (v: number) => (v === 0 ? 0 : Math.max(3, (v / max) * PLOT_HEIGHT));

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center gap-4 text-[13px] text-ink-2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-call-mark" />
          To call
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-watch-mark" />
          To watch
        </span>
      </figcaption>

      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-full items-end gap-4 border-b border-line-strong px-1" style={{ height: PLOT_HEIGHT + 24 }}>
          {runs.map((d) => {
            const call = d.counts?.call ?? 0;
            const watch = d.counts?.watch ?? 0;
            return (
              <div
                key={d.id}
                tabIndex={0}
                className="group relative flex min-w-[56px] flex-1 items-end justify-center gap-0.5 rounded-sm outline-offset-4"
                aria-label={`Week of ${formatDate(d.week_start)}: ${call} to call, ${watch} to watch`}
              >
                {[
                  { v: call, cls: "bg-call-mark" },
                  { v: watch, cls: "bg-watch-mark" },
                ].map((bar, i) => (
                  <div key={i} className="flex w-5 flex-col items-center justify-end">
                    <span className="mb-1 text-[11px] font-semibold text-ink-2 tabular-nums">{bar.v}</span>
                    <span className={`block w-full rounded-t-[4px] ${bar.cls}`} style={{ height: height(bar.v) }} />
                  </div>
                ))}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-white shadow group-hover:block group-focus-visible:block"
                >
                  {formatDate(d.week_start)}: {call} call · {watch} watch
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex min-w-full gap-4 px-1 pt-2">
          {runs.map((d) => (
            <span key={d.id} className="min-w-[56px] flex-1 text-center text-[11px] text-ink-3">
              {new Date(d.week_start).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
