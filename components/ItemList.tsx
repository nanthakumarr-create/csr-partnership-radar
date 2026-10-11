"use client";

import { useState } from "react";
import { SIGNAL_LABELS, SIGNAL_TYPES, type DigestItemRow, type SignalType, type Verdict } from "@/lib/types";

const VERDICT_STYLE: Record<Verdict, string> = {
  call: "border-green-700 bg-green-50 text-green-800",
  watch: "border-amber-600 bg-amber-50 text-amber-800",
  skip: "border-gray-300 bg-gray-50 text-gray-600",
};

const GROUPS: { verdict: Verdict; title: string }[] = [
  { verdict: "call", title: "Call this week" },
  { verdict: "watch", title: "Watch" },
  { verdict: "skip", title: "Skipped" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "date unknown";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

function Item({ item }: { item: DigestItemRow }) {
  return (
    <li className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-gray-900">{item.company ?? "Company not named"}</span>
        <span className="rounded-[6px] border border-gray-300 px-2 py-0.5 text-xs text-gray-700">
          {item.signal_type ? SIGNAL_LABELS[item.signal_type] : "Unclassified"}
        </span>
        <span className={`rounded-[6px] border px-2 py-0.5 text-xs font-medium ${VERDICT_STYLE[item.verdict]}`}>
          {item.verdict}
        </span>
      </div>
      {item.summary && <p className="mt-2 text-gray-900">{item.summary}</p>}
      {item.why_it_matters && (
        <p className="mt-1 text-sm text-gray-700">
          <span className="font-medium">Why it matters:</span> {item.why_it_matters}
        </p>
      )}
      {item.reason && (
        <p className="mt-1 text-sm text-gray-700">
          <span className="font-medium">Call?</span> {item.reason}
        </p>
      )}
      <p className="mt-2 text-sm text-gray-500">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline-offset-2 hover:underline"
        >
          {item.source}
        </a>{" "}
        · {formatDate(item.published_at)}
        <span className="sr-only"> (opens in a new tab)</span>
      </p>
    </li>
  );
}

export function ItemList({ items }: { items: DigestItemRow[] }) {
  const [filter, setFilter] = useState<SignalType | "all">("all");
  const visible = filter === "all" ? items : items.filter((i) => i.signal_type === filter);

  return (
    <div>
      <label className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
        Signal type
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as SignalType | "all")}
          className="rounded-[6px] border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
        >
          <option value="all">All</option>
          {SIGNAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {SIGNAL_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      {GROUPS.map(({ verdict, title }) => {
        const group = visible.filter((i) => i.verdict === verdict);
        const heading = `${title} (${group.length})`;
        const list = group.length ? (
          <ul>
            {group.map((item) => (
              <Item key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <p className="py-3 text-sm text-gray-500">Nothing here{filter === "all" ? " this week" : " for this filter"}.</p>
        );

        if (verdict === "skip") {
          return (
            <details key={verdict} className="mt-8 rounded-[6px] border border-gray-200 px-4">
              <summary className="cursor-pointer py-3 text-base font-semibold text-gray-700">{heading}</summary>
              {list}
            </details>
          );
        }
        return (
          <section key={verdict} className="mt-8" aria-labelledby={`group-${verdict}`}>
            <h2 id={`group-${verdict}`} className="border-b border-gray-200 pb-2 text-base font-semibold text-accent">
              {heading}
            </h2>
            {list}
          </section>
        );
      })}
    </div>
  );
}
