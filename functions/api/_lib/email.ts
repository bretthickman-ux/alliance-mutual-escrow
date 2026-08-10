/* Shared email rendering + sending for Pages Functions.
   The _lib directory is underscore-prefixed so Pages never routes it.

   Design: every message goes out twice, per IT guidance (Ryan, 2026-08-10):
   one branded email to the client, one plain internal notification to the
   team list (NOTIFY_TO, comma-separated; falls back to INQUIRY_TO, then
   info@ameescrow.com). No distribution list or mailbox needed. */

export interface SendEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  INQUIRY_TO?: string;
  NOTIFY_TO?: string;
}

export const FALLBACK_FROM = 'Alliance Mutual Escrow <onboarding@resend.dev>';

export function notifyList(env: SendEnv): string[] {
  const raw = env.NOTIFY_TO || env.INQUIRY_TO || 'info@ameescrow.com';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export async function resendSend(
  env: SendEnv,
  msg: { to: string[]; subject: string; text: string; html?: string; replyTo?: string },
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM || FALLBACK_FROM,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      ...(msg.html ? { html: msg.html } : {}),
      ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error('Resend ' + res.status);
}

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Branded HTML shell: ink header with the wordmark, paper body, amber
    accents, footer with license line. Inline styles only; web-safe fonts. */
export function brandHtml(opts: {
  kicker: string;
  heading: string;
  intro?: string;
  bodyHtml: string;
  footNote?: string;
}): string {
  const { kicker, heading, intro, bodyHtml, footNote } = opts;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f6f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f2;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fdfdfc;border-radius:16px;overflow:hidden;border:1px solid #e7e4dd;">
  <tr><td style="background:#0f1215;padding:26px 32px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#fdfdfc;">Alliance Mutual Escrow</div>
    <div style="font-family:Courier,monospace;font-size:10px;letter-spacing:3px;color:#d9a56f;margin-top:6px;">INDEPENDENT &middot; DFPI LICENSED</div>
  </td></tr>
  <tr><td style="padding:30px 32px 8px;">
    <div style="font-family:Courier,monospace;font-size:11px;letter-spacing:3px;color:#b97a3a;text-transform:uppercase;">${esc(kicker)}</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#0f1215;margin-top:10px;line-height:1.2;">${esc(heading)}</div>
    ${intro ? `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#4a4f55;margin:14px 0 0;">${esc(intro)}</p>` : ''}
  </td></tr>
  <tr><td style="padding:18px 32px 26px;">${bodyHtml}</td></tr>
  ${footNote ? `<tr><td style="padding:0 32px 26px;"><p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#9aa0a6;margin:0;">${esc(footNote)}</p></td></tr>` : ''}
  <tr><td style="background:#0f1215;padding:20px 32px;">
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#9aa0a6;">
      Alliance Mutual Escrow, Inc. &middot; 12681 Newport Ave, Tustin, CA 92780 &middot; (714) 544-6525<br>
      Licensed by the California Department of Financial Protection and Innovation &middot; Escrow Agents License No. 9631912
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

/** A labeled row table (label left, value right) for detail lists. */
export function rowsHtml(rows: Array<{ label: string; value: string; strong?: boolean }>): string {
  const tr = rows
    .map(
      (r) => `<tr>
  <td style="padding:9px 0;border-bottom:1px solid #eeebe4;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#4a4f55;">${esc(r.label)}</td>
  <td align="right" style="padding:9px 0;border-bottom:1px solid #eeebe4;font-family:${r.strong ? "Georgia,'Times New Roman',serif" : 'Courier,monospace'};font-size:${r.strong ? '16px' : '13px'};color:${r.strong ? '#b97a3a' : '#0f1215'};">${esc(r.value)}</td>
</tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tr}</table>`;
}
