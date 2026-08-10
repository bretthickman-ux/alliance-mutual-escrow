/* Cloudflare Pages Function: POST /api/review-digest
   The review tours' "Send" buttons post plain-text results here; they are
   emailed to Brett (owner-review workflow is internal and never goes to the
   team notification list). Laura's compliance walkthrough may also attach
   files (rate sheets, marked-up PDFs), forwarded via Resend attachments. */

import { resendSend, type SendEnv } from './_lib/email';
import { logLead, type LeadsEnv } from './_lib/leads';

interface DigestRequest {
  digest?: string;
  reviewer?: string; // 'mike' (default) | 'laura'
  attachments?: Array<{ filename?: string; content?: string }>; // base64
}

const MAX_ATTACH_TOTAL = 25 * 1024 * 1024; // ~25MB of base64 text, under Resend's 40MB cap

export const onRequestPost: PagesFunction<SendEnv & LeadsEnv & { REVIEW_TO?: string }> = async (context) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  let body: DigestRequest;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'Could not read that.' }, 400);
  }

  const digest = String(body.digest || '').trim();
  if (digest.length < 10 || digest.length > 60_000) {
    return json({ ok: false, error: 'Nothing to send yet.' }, 400);
  }
  if (!context.env.RESEND_API_KEY) {
    return json({ ok: false, error: 'Sending is not connected. Use Copy results instead.' }, 503);
  }

  const attachments = (body.attachments || [])
    .filter((a) => a && a.filename && a.content)
    .map((a) => ({
      filename: String(a.filename).slice(0, 120).replace(/[^\w. ()-]/g, '_'),
      content: String(a.content),
    }));
  const totalSize = attachments.reduce((n, a) => n + a.content.length, 0);
  if (totalSize > MAX_ATTACH_TOTAL) {
    return json({ ok: false, error: 'Attachments are too large to email. Keep them under about 18MB together.' }, 400);
  }

  const reviewer = body.reviewer === 'laura' ? 'Laura' : 'Owner';
  const to = context.env.REVIEW_TO || 'bretth@sevengables.com';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${context.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: context.env.EMAIL_FROM || 'Alliance Mutual Escrow <onboarding@resend.dev>',
        to: [to],
        subject: `${reviewer} review results, AME site${attachments.length ? ` (+${attachments.length} attachment${attachments.length > 1 ? 's' : ''})` : ''}`,
        text: digest,
        ...(attachments.length ? { attachments } : {}),
      }),
    });
    if (!res.ok) throw new Error('Resend ' + res.status);
    // Laura's completed review is logged so the daily reminder knows to stop.
    if (body.reviewer === 'laura') {
      await logLead(context.env, {
        Type: 'Laura Review' as never,
        Name: 'Laura Woodbury',
        Summary: digest.slice(0, 2000),
      });
    }
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'Sending failed. Use Copy results instead.' }, 502);
  }
};
