"use client";

import { useMemo, useState, type ReactNode } from "react";
import { SIGNAL_LABELS, SIGNAL_TYPES, type DigestItemRow, type SignalType } from "@/lib/types";
import { ExternalIcon, SignalTag, VerdictBadge } from "./ui";

type Tab = "call" | "watch" | "policy" | "skip" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "call", label: "Call this week" },
  { id: "watch", label: "Watch" },
  { id: "policy", label: "Policy" },
  { id: "skip", label: "Skipped" },
  { id: "all", label: "All" },
];

const EMPTY_TEXT: Record<Tab, string> = {
  call: "Nothing needs a call this week.",
  watch: "Nothing to watch this week.",
  policy: "No policy or regulatory changes this week.",
  skip: "Nothing was skipped.",
  all: "This digest has no items.",
};

const inTab = (item: DigestItemRow, tab: Tab) =>
  tab === "all"
    ? true
    : tab === "policy"
      ? item.signal_type === "policy_change" && item.verdict !== "skip"
      : item.verdict === tab;

function formatShortDate(iso: string | null): string {
  if (!iso) return "Date unknown";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

function ItemCard({ item }: { item: DigestItemRow }) {
  const meta = [item.region, item.sector].filter(Boolean) as string[];
  return (
    <li className="rounded-lg border border-line bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={`mr-1 text-base font-semibold ${item.company ? "text-ink" : "text-ink-3 italic"}`}>
          {item.company ?? "Company not named"}
        </h3>
        <SignalTag signal={item.signal_type} />
        {item.priority != null && item.verdict !== "skip" && (
          <span
            className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums"
            title={`Priority ${item.priority} of 5 (1 is most urgent)`}
          >
            P{item.priority}
          </span>
        )}
        <span className="ml-auto">
          <VerdictBadge verdict={item.verdict} />
        </span>
      </div>

      {item.summary && <p className="mt-3 text-[15px] leading-relaxed text-ink">{item.summary}</p>}

      {(item.why_it_matters || item.reason) && (
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          {item.why_it_matters && (
            <div className="rounded-md bg-canvas px-3.5 py-3">
              <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Why it matters</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-2">{item.why_it_matters}</dd>
            </div>
          )}
          {item.reason && (
            <div
              className={`rounded-md px-3.5 py-3 ${
                item.verdict === "call" ? "bg-call-soft" : item.verdict === "watch" ? "bg-watch-soft" : "bg-canvas"
              }`}
            >
              <dt className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Call this week?</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-2">{item.reason}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-[13px] text-ink-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-0 items-center gap-1 font-medium text-accent hover:underline"
        >
          <span className="line-clamp-1">{item.title}</span>
          <ExternalIcon />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <span>
          {item.source} · {formatShortDate(item.published_at)}
        </span>
        {meta.length > 0 && <span>{meta.join(" · ")}</span>}
      </div>
    </li>
  );
}

function SignalMix({
  items,
  active,
  onSelect,
}: {
  items: DigestItemRow[];
  active: SignalType | "all";
  onSelect: (s: SignalType | "all") => void;
}) {
  const relevant = items.filter((i) => i.verdict !== "skip");
  const rows = SIGNAL_TYPES.map((s) => {
    const of = relevant.filter((i) => i.signal_type === s);
    return {
      signal: s,
      total: of.length,
      call: of.filter((i) => i.verdict === "call").length,
      watch: of.filter((i) => i.verdict === "watch").length,
    };
  });
  const max = Math.max(1, ...rows.map((r) => r.total));
  const unclassified = relevant.filter((i) => i.signal_type === null).length;

  return (
    <section className="rounded-lg border border-line bg-white">
      <header className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">Signal mix</h2>
        <p className="mt-0.5 text-[13px] text-ink-3">Call and watch items by signal type. Click to filter.</p>
      </header>
      <ul className="space-y-1 px-3 py-3">
        {rows.map((r) => {
          const selected = active === r.signal;
          return (
            <li key={r.signal}>
              <button
                type="button"
                onClick={() => onSelect(selected ? "all" : r.signal)}
                aria-pressed={selected}
                className={`group relative w-full rounded-md px-2 py-2 text-left transition-colors ${
                  selected ? "bg-accent-soft" : "hover:bg-canvas"
                }`}
              >
                <span className="flex items-baseline justify-between text-[13px]">
                  <span className={selected ? "font-semibold text-accent" : "font-medium text-ink-2"}>
                    {SIGNAL_LABELS[r.signal]}
                  </span>
                  <span className="font-semibold text-ink tabular-nums">{r.total}</span>
                </span>
                <span className="mt-1.5 block h-2.5 w-full">
                  {r.total > 0 && (
                    <span
                      className="block h-full rounded-r-[4px] bg-series-1"
                      style={{ width: `${(r.total / max) * 100}%` }}
                    />
                  )}
                </span>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute right-2 -top-8 z-10 hidden rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-white shadow group-hover:block group-focus-visible:block"
                >
                  {SIGNAL_LABELS[r.signal]}: {r.call} call, {r.watch} watch
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {unclassified > 0 && (
        <p className="border-t border-line px-5 py-3 text-[13px] text-ink-3">
          {unclassified} more relevant item{unclassified === 1 ? " has" : "s have"} no clear signal type.
        </p>
      )}
    </section>
  );
}

export function Triage({ items, rail }: { items: DigestItemRow[]; rail: ReactNode }) {
  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.id, items.filter((i) => inTab(i, t.id)).length])) as Record<Tab, number>,
    [items],
  );
  const [tab, setTab] = useState<Tab>(counts.call > 0 ? "call" : counts.watch > 0 ? "watch" : "all");
  const [signal, setSignal] = useState<SignalType | "all">("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        inTab(i, tab) &&
        (signal === "all" || i.signal_type === signal) &&
        (!q ||
          [i.company, i.title, i.summary, i.source, i.region, i.sector].some((f) => f?.toLowerCase().includes(q))),
    );
  }, [items, tab, signal, query]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <div role="tablist" aria-label="Verdict" className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setTab(t.id)}
                className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  selected ? "border-accent text-accent" : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-px text-xs tabular-nums ${
                    selected ? "bg-accent text-white" : "bg-skip-soft text-ink-2"
                  }`}
                >
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Search items</span>
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, topic or source"
              className="w-full rounded-md border border-line bg-white py-2 pr-3 pl-9 text-sm placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            Signal
            <select
              value={signal}
              onChange={(e) => setSignal(e.target.value as SignalType | "all")}
              className="rounded-md border border-line bg-white px-2.5 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="all">All types</option>
              {SIGNAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SIGNAL_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 text-[13px] text-ink-3" aria-live="polite">
          Showing {visible.length} of {counts[tab]}
          {signal !== "all" && (
            <>
              {" "}· {SIGNAL_LABELS[signal]}{" "}
              <button type="button" onClick={() => setSignal("all")} className="font-medium text-accent hover:underline">
                Clear
              </button>
            </>
          )}
        </p>

        {visible.length ? (
          <ul className="mt-3 space-y-3">
            {visible.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-line-strong bg-white px-6 py-10 text-center text-sm text-ink-2">
            {query || signal !== "all" ? "No items match these filters." : EMPTY_TEXT[tab]}
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <SignalMix items={items} active={signal} onSelect={setSignal} />
        {rail}
      </aside>
    </div>
  );
}
