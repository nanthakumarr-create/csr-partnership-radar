import type { ReactNode } from "react";
import { SIGNAL_LABELS, type DigestRow, type SignalType, type Verdict } from "@/lib/types";

export function Card({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-line bg-white ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

const VERDICT_STYLE: Record<Verdict, string> = {
  call: "border-call-line bg-call-soft text-call",
  watch: "border-watch-line bg-watch-soft text-watch",
  skip: "border-line bg-skip-soft text-skip",
};
const VERDICT_LABEL: Record<Verdict, string> = { call: "Call", watch: "Watch", skip: "Skip" };

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${VERDICT_STYLE[verdict]}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function SignalTag({ signal }: { signal: SignalType | null }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-white px-2 py-0.5 text-xs font-medium text-ink-2">
      {signal ? SIGNAL_LABELS[signal] : "Unclassified"}
    </span>
  );
}

const STATUS_STYLE: Record<DigestRow["status"], string> = {
  success: "border-call-line bg-call-soft text-call",
  partial: "border-watch-line bg-watch-soft text-watch",
  failed: "border-red-200 bg-danger-soft text-danger",
};
const STATUS_LABEL: Record<DigestRow["status"], string> = {
  success: "Succeeded",
  partial: "Partial",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: DigestRow["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "call" | "watch" | "accent" | "neutral";
}) {
  const bar = {
    call: "bg-call-mark",
    watch: "bg-watch-mark",
    accent: "bg-accent",
    neutral: "bg-line-strong",
  }[tone];
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-white px-5 py-4">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
      <p className="text-[13px] font-medium text-ink-2">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  meta,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {meta && <div className="mt-1.5 text-sm text-ink-2">{meta}</div>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ink-2">{children}</div>}
    </div>
  );
}

export function ExternalIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
