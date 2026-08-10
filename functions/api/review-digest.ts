/* Cloudflare Pages Function: POST /api/review-digest
   The owner review tour's "Send results" button posts the plain-text digest
   here; it is emailed to the team list. No storage, no auth: the digest
   contains only review verdicts on public site copy. */

import { resendSend, type SendEnv } from './_lib/email';

export const onRequestPost: PagesFunction<SendEnv> = async (context) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  let body: { digest?: string };
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

  try {
    // Owner-review digests are internal workflow between Mike and Brett;
    // they never go to the team notification list.
    const to = (context.env as SendEnv & { REVIEW_TO?: string }).REVIEW_TO || 'bretth@sevengables.com';
    await resendSend(context.env, {
      to: [to],
      subject: 'Owner review results, AME site',
      text: digest,
    });
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'Sending failed. Use Copy results instead.' }, 502);
  }
};
