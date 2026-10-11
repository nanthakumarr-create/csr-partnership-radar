import { Resend } from "resend";
import { formatDate } from "../dates";
import { appUrl, requireEnv } from "../env";
import { SIGNAL_LABELS, type AnalysedItem } from "../types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ACCENT = "#1e3a8a";
const MUTED = "#6b7280";

function itemHtml(item: AnalysedItem): string {
  const tag = item.signal_type ? SIGNAL_LABELS[item.signal_type] : "Unclassified";
  return `
<tr><td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
  <div style="font-size:15px;font-weight:600;color:#111827;">${esc(item.company ?? "Company not named")}
    <span style="display:inline-block;margin-left:8px;padding:2px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;font-weight:500;color:#374151;">${esc(tag)}</span>
  </div>
  <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#111827;">${esc(item.summary)}</p>
  ${item.why_it_matters ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#374151;"><strong>Why it matters:</strong> ${esc(item.why_it_matters)}</p>` : ""}
  <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#374151;"><strong>Call?</strong> ${esc(item.reason)}</p>
  <p style="margin:8px 0 0;font-size:13px;color:${MUTED};"><a href="${esc(item.url)}" style="color:${ACCENT};">${esc(item.source)}</a> &middot; ${esc(formatDate(item.publishedAt))}</p>
</td></tr>`;
}

function section(title: string, items: AnalysedItem[]): string {
  const body = items.length
    ? items.map(itemHtml).join("")
    : `<tr><td style="padding:12px 0;font-size:14px;color:${MUTED};">Nothing this week.</td></tr>`;
  return `
<h2 style="margin:32px 0 0;font-size:17px;color:${ACCENT};">${esc(title)} (${items.length})</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${body}</table>`;
}

export function renderEmail(items: AnalysedItem[], weekStart: string, digestId: string): { subject: string; html: string } {
  const policy = items.filter((i) => i.signal_type === "policy_change" && i.verdict !== "skip");
  const call = items.filter((i) => i.verdict === "call" && i.signal_type !== "policy_change");
  const watch = items.filter((i) => i.verdict === "watch" && i.signal_type !== "policy_change");
  const skipped = items.filter((i) => i.verdict === "skip").length;
  const link = `${appUrl()}/digests/${digestId}`;
  const week = formatDate(weekStart);

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
<div style="max-width:640px;margin:0 auto;">
  <h1 style="margin:0;font-size:20px;">CSR Partnership Radar</h1>
  <p style="margin:4px 0 0;font-size:14px;color:${MUTED};">Week of ${esc(week)} &middot; ${call.length} to call &middot; ${watch.length} to watch</p>
  ${section("Call this week", call)}
  ${section("Watch", watch)}
  ${section("Policy & regulation", policy)}
  <p style="margin:32px 0 0;font-size:14px;color:${MUTED};">${skipped} item${skipped === 1 ? "" : "s"} skipped as not relevant. <a href="${esc(link)}" style="color:${ACCENT};">Open the full digest</a>.</p>
</div>
</body></html>`;

  return { subject: `CSR Radar, week of ${week}: ${call.length} to call, ${watch.length} to watch`, html };
}

export async function sendEmail(input: {
  to: string;
  items: AnalysedItem[];
  weekStart: string;
  digestId: string;
}): Promise<void> {
  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const { subject, html } = renderEmail(input.items, input.weekStart, input.digestId);
  const { error } = await resend.emails.send({
    from: process.env.DIGEST_FROM_EMAIL || "onboarding@resend.dev",
    to: input.to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
