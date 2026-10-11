"use client";

import Link from "next/link";
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import type { DigestCounts, Settings } from "@/lib/types";

const EXPECTED_RUN_SECONDS = 50;

function ChipInput({
  label,
  help,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  help: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();

  const add = () => {
    const value = draft.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setDraft("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <p className="mt-0.5 text-[13px] text-ink-3">{help}</p>
      <div className="mt-2 flex flex-wrap gap-2 rounded-md border border-line bg-white p-2 focus-within:border-accent">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded-md bg-accent-soft py-0.5 pr-1 pl-2 text-sm text-accent">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="rounded px-1 text-accent/70 hover:bg-white hover:text-accent"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder={placeholder}
          className="min-w-[10rem] flex-1 px-1 py-0.5 text-sm outline-none placeholder:text-ink-3"
        />
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white">
      <header className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>
      </header>
      <div className="space-y-6 px-5 py-5">{children}</div>
    </section>
  );
}

type RunState =
  | { kind: "idle" }
  | { kind: "running"; seconds: number }
  | { kind: "done"; status: string; counts: DigestCounts; emailSent: boolean; errors: string[] }
  | { kind: "error"; message: string };

const same = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function SettingsForm({ initial }: { initial: Settings }) {
  const [saved, setSaved] = useState(initial);
  const [sectors, setSectors] = useState(initial.sectors);
  const [regions, setRegions] = useState(initial.regions);
  const [keywords, setKeywords] = useState(initial.extra_keywords);
  const [email, setEmail] = useState(initial.recipient_email);
  const [passcode, setPasscode] = useState("");
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [run, setRun] = useState<RunState>({ kind: "idle" });

  const dirty =
    !same(sectors, saved.sectors) ||
    !same(regions, saved.regions) ||
    !same(keywords, saved.extra_keywords) ||
    email !== saved.recipient_email;

  const running = run.kind === "running";
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setRun((r) => (r.kind === "running" ? { kind: "running", seconds: r.seconds + 1 } : r)),
      1000,
    );
    return () => clearInterval(timer);
  }, [running]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode) {
      setSaveMessage({ ok: false, text: "Enter the passcode to save." });
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ sectors, regions, extra_keywords: keywords, recipient_email: email }),
      });
      const body = await res.json();
      if (res.ok) {
        setSaved(body);
        setSaveMessage({ ok: true, text: "Saved. The next digest will use these settings." });
      } else {
        setSaveMessage({ ok: false, text: body.error ?? "Could not save." });
      }
    } catch {
      setSaveMessage({ ok: false, text: "Could not reach the server." });
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
    if (!passcode) {
      setRun({ kind: "error", message: "Enter the passcode to run a digest." });
      return;
    }
    setRun({ kind: "running", seconds: 0 });
    try {
      const res = await fetch("/api/digest/run", { method: "POST", headers: { "x-admin-passcode": passcode } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRun({ kind: "error", message: body.error ?? `Run failed (HTTP ${res.status}).` });
        return;
      }
      setRun({ kind: "done", status: body.status, counts: body.counts, emailSent: body.emailSent, errors: body.errors ?? [] });
    } catch {
      setRun({ kind: "error", message: "Could not reach the server." });
    }
  }

  const progress = run.kind === "running" ? Math.min(95, (run.seconds / EXPECTED_RUN_SECONDS) * 100) : 0;

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Section title="Focus areas" description="What the radar searches for each week. Press Enter to add.">
          <ChipInput
            label="Sectors"
            help="Programme areas your NGO works in."
            values={sectors}
            onChange={setSectors}
            placeholder="Add a sector"
          />
          <ChipInput
            label="Regions"
            help="Where you run programmes. Pan-India is always considered."
            values={regions}
            onChange={setRegions}
            placeholder="Add a region"
          />
          <ChipInput
            label="Extra keywords"
            help="Optional: companies or foundations you want to track closely."
            values={keywords}
            onChange={setKeywords}
            placeholder="e.g. Tata Trusts"
          />
        </Section>

        <Section title="Delivery" description="Where and when the digest is sent.">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Recipient email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-canvas px-3.5 py-3">
              <dt className="text-[13px] text-ink-3">Schedule</dt>
              <dd className="mt-0.5 font-medium text-ink">Every Monday, 06:30 IST</dd>
            </div>
            <div className="rounded-md bg-canvas px-3.5 py-3">
              <dt className="text-[13px] text-ink-3">Covers</dt>
              <dd className="mt-0.5 font-medium text-ink">News from the past 7 days</dd>
            </div>
          </dl>
        </Section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <section className="rounded-lg border border-line bg-white">
          <header className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Admin</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">The passcode is needed to save or run.</p>
          </header>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-ink">
                Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoComplete="current-password"
                className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={saving || !dirty}
                className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : dirty ? "Save changes" : "No unsaved changes"}
              </button>
              <div aria-live="polite">
                {saveMessage && (
                  <p className={`text-[13px] ${saveMessage.ok ? "text-call" : "text-danger"}`}>{saveMessage.text}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white">
          <header className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Run a digest now</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">
              Fetches this week&apos;s news, analyses it and emails the result. Uses the saved settings.
            </p>
          </header>
          <div className="space-y-4 px-5 py-5" aria-live="polite">
            <button
              type="button"
              onClick={runNow}
              disabled={running}
              className="w-full rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {running ? "Running…" : "Run digest now"}
            </button>
            {dirty && !running && (
              <p className="text-[13px] text-watch">You have unsaved changes. Save first to use them in this run.</p>
            )}

            {run.kind === "running" && (
              <div>
                <div className="flex justify-between text-[13px] text-ink-2">
                  <span>Fetching, analysing and emailing</span>
                  <span className="tabular-nums">{run.seconds}s</span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-canvas"
                  role="progressbar"
                  aria-label="Digest run progress (estimated)"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-accent transition-[width] duration-1000" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-ink-3">Usually takes 45–60 seconds. Keep this page open.</p>
              </div>
            )}

            {run.kind === "error" && (
              <p className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{run.message}</p>
            )}

            {run.kind === "done" && (
              <div className="space-y-3">
                <p className={`text-sm font-semibold ${run.status === "failed" ? "text-danger" : run.status === "partial" ? "text-watch" : "text-call"}`}>
                  Run {run.status === "success" ? "succeeded" : run.status}
                </p>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Call", value: run.counts.call, cls: "text-call" },
                    { label: "Watch", value: run.counts.watch, cls: "text-watch" },
                    { label: "Skip", value: run.counts.skip, cls: "text-ink-2" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-md bg-canvas py-2">
                      <dd className={`text-xl font-semibold tabular-nums ${s.cls}`}>{s.value}</dd>
                      <dt className="text-xs text-ink-3">{s.label}</dt>
                    </div>
                  ))}
                </dl>
                <p className="text-[13px] text-ink-2">
                  {run.counts.fetched} articles fetched, {run.counts.after_dedup} new after de-duplication
                  {run.counts.failed ? `, ${run.counts.failed} not analysed` : ""}. Email {run.emailSent ? "sent" : "not sent"}.
                </p>
                {run.errors.length > 0 && (
                  <ul className="list-disc space-y-1 rounded-md bg-watch-soft py-2 pr-3 pl-7 text-[13px] text-watch">
                    {run.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
                <Link href="/" className="inline-block text-sm font-semibold text-accent hover:underline">
                  Open the digest →
                </Link>
              </div>
            )}
          </div>
        </section>
      </aside>
    </form>
  );
}
