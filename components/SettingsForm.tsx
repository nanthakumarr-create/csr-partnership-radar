"use client";

import Link from "next/link";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import type { DigestCounts, Settings } from "@/lib/types";

function ChipInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
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
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label}
      </label>
      <div className="mt-2 flex flex-wrap gap-2 rounded-[6px] border border-gray-300 p-2 focus-within:border-accent">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded-[6px] border border-gray-300 bg-gray-50 px-2 py-0.5 text-sm">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="px-1 text-gray-500 hover:text-gray-900"
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
          className="min-w-[10rem] flex-1 px-1 py-0.5 text-sm outline-none"
        />
      </div>
    </div>
  );
}

type RunState =
  | { kind: "idle" }
  | { kind: "running"; seconds: number }
  | { kind: "done"; status: string; counts: DigestCounts; emailSent: boolean; errors: string[] }
  | { kind: "error"; message: string };

export function SettingsForm({ initial }: { initial: Settings }) {
  const [sectors, setSectors] = useState(initial.sectors);
  const [regions, setRegions] = useState(initial.regions);
  const [keywords, setKeywords] = useState(initial.extra_keywords);
  const [email, setEmail] = useState(initial.recipient_email);
  const [passcode, setPasscode] = useState("");
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [run, setRun] = useState<RunState>({ kind: "idle" });

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
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ sectors, regions, extra_keywords: keywords, recipient_email: email }),
      });
      const body = await res.json();
      setSaveMessage(res.ok ? { ok: true, text: "Settings saved." } : { ok: false, text: body.error ?? "Could not save." });
    } catch {
      setSaveMessage({ ok: false, text: "Could not reach the server." });
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
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

  return (
    <form onSubmit={save} className="mt-6 space-y-6">
      <ChipInput label="Sectors" values={sectors} onChange={setSectors} placeholder="Add a sector and press Enter" />
      <ChipInput label="Regions" values={regions} onChange={setRegions} placeholder="Add a region and press Enter" />
      <ChipInput
        label="Extra keywords"
        values={keywords}
        onChange={setKeywords}
        placeholder="Optional, e.g. a company name"
      />

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
          Recipient email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2 w-full rounded-[6px] border border-gray-300 px-3 py-2 text-sm focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="passcode" className="block text-sm font-medium text-gray-900">
          Passcode
        </label>
        <input
          id="passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          autoComplete="current-password"
          className="mt-2 w-full max-w-xs rounded-[6px] border border-gray-300 px-3 py-2 text-sm focus:border-accent"
        />
        <p className="mt-1 text-xs text-gray-500">Needed to save settings or run a digest.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[6px] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={runNow}
          disabled={running}
          className="rounded-[6px] border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:border-accent disabled:opacity-60"
        >
          {running ? "Running…" : "Run digest now"}
        </button>
      </div>

      <div aria-live="polite" className="space-y-2 text-sm">
        {saveMessage && <p className={saveMessage.ok ? "text-green-800" : "text-red-700"}>{saveMessage.text}</p>}
        {run.kind === "running" && (
          <p className="text-gray-700">
            Fetching news, analysing and emailing… {run.seconds}s (usually under a minute)
          </p>
        )}
        {run.kind === "error" && <p className="text-red-700">{run.message}</p>}
        {run.kind === "done" && (
          <div className="rounded-[6px] border border-gray-200 p-3 text-gray-800">
            <p>
              Run {run.status}: {run.counts.fetched} fetched, {run.counts.after_dedup} after removing duplicates —{" "}
              {run.counts.call} call, {run.counts.watch} watch, {run.counts.skip} skip
              {run.counts.failed ? `, ${run.counts.failed} not analysed` : ""}. Email {run.emailSent ? "sent" : "not sent"}.
            </p>
            {run.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-amber-900">
                {run.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <p className="mt-2">
              <Link href="/" className="text-accent underline">
                View the digest
              </Link>
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
