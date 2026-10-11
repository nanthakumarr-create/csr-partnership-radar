const DAY_MS = 24 * 60 * 60 * 1000;

/** Keep items published in the 7 days before `now` (small allowance for clock skew). */
export function filterLast7Days<T extends { publishedAt: string }>(items: T[], now: Date = new Date()): T[] {
  const end = now.getTime() + 60 * 60 * 1000;
  const start = now.getTime() - 7 * DAY_MS;
  return items.filter((item) => {
    const t = Date.parse(item.publishedAt);
    return Number.isFinite(t) && t >= start && t <= end;
  });
}

/** Monday of the current week in IST, as YYYY-MM-DD. */
export function weekStartIST(now: Date = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const daysSinceMonday = (ist.getUTCDay() + 6) % 7;
  return new Date(ist.getTime() - daysSinceMonday * DAY_MS).toISOString().slice(0, 10);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

/** Next scheduled run: Mondays 01:00 UTC (06:30 IST). */
export function nextCronRun(now: Date = new Date()): Date {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 1, 0, 0));
  const daysUntilMonday = (8 - next.getUTCDay()) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 7);
  return next;
}
