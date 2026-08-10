/* Cloudflare Pages Function: POST /api/inquiry
   Open-an-Escrow inquiries. Two sends per submission (IT guidance):
   1. Internal notification to the team list (NOTIFY_TO, comma-separated;
      reply-to is the visitor when they left an email).
   2. A branded confirmation to the visitor when their contact is an email.
   Nothing is stored; the honeypot field silently succeeds for bots. */

import { brandHtml, rowsHtml, notifyList, type SendEnv, resendSend } from './_lib/email';

interface InquiryRequest {
  role: string;
  city: string;
  timing: string;
  name: string;
  contact: string;
  company?: string; // honeypot
}

export const onRequestPost: PagesFunction<SendEnv> = async (context) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  let body: InquiryRequest;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'Could not read that. Try again.' }, 400);
  }

  // Honeypot: bots fill everything. Pretend success, send nothing.
  if (body.company && body.company.trim() !== '') return json({ ok: true, queued: true });

  if (!body.name || body.name.trim().length < 2) {
    return json({ ok: false, error: 'Add your name so your escrow officer knows who to ask for.' }, 400);
  }
  const contact = (body.contact || '').trim();
  const looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const looksPhone = contact.replace(/\D/g, '').length >= 10;
  if (!looksEmail && !looksPhone) {
    return json({ ok: false, error: 'Add a phone number or an email so we can reach you.' }, 400);
  }

  const env = context.env;
  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: 'Sending is not connected yet. Call (714) 544-6525 and we will take it from there.' }, 503);
  }

  const clean = (s: string) => String(s || '').slice(0, 200).replace(/[\r\n]+/g, ' ');
  const details = [
    { label: 'Who', value: clean(body.name), strong: true },
    { label: 'Reach at', value: clean(contact) },
    { label: 'Their role', value: clean(body.role) },
    { label: 'Property city', value: clean(body.city) },
    { label: 'Timeline', value: clean(body.timing) },
  ];
  const internalText = [
    'New escrow inquiry from the website',
    '',
    ...details.map((d) => `${(d.label + ':').padEnd(15)}${d.value}`),
    '',
    'Reply directly to the contact above.',
  ].join('\n');
  const internalHtml = brandHtml({
    kicker: 'Website inquiry',
    heading: `${clean(body.name)} wants to open an escrow`,
    intro: 'Submitted through the Open an Escrow flow just now.',
    bodyHtml: rowsHtml(details),
    footNote: looksEmail ? 'Replying to this email reaches the visitor directly.' : 'The visitor left a phone number; call them back.',
  });

  try {
    await resendSend(env, {
      to: notifyList(env),
      subject: `Escrow inquiry: ${clean(body.name)} · ${clean(body.role)}`,
      text: internalText,
      html: internalHtml,
      replyTo: looksEmail ? contact : undefined,
    });

    if (looksEmail) {
      // Confirmation to the visitor. A failure here never fails the inquiry.
      const confirmHtml = brandHtml({
        kicker: 'We have it',
        heading: 'Your inquiry is with the team.',
        intro: 'A licensed escrow officer will reach out shortly. If it is faster, call us any business day.',
        bodyHtml: rowsHtml([
          { label: 'Name', value: clean(body.name) },
          { label: 'Property city', value: clean(body.city) },
          { label: 'Timeline', value: clean(body.timing) },
          { label: 'Call us', value: '(714) 544-6525', strong: true },
        ]),
        footNote: 'You are receiving this because this address was entered on alliance-mutual-escrow. If that was not you, no action is needed.',
      });
      try {
        await resendSend(env, {
          to: [contact],
          subject: 'We received your escrow inquiry',
          text: [
            'Alliance Mutual Escrow',
            '',
            'Your inquiry is with the team. A licensed escrow officer will reach out shortly.',
            'Faster by phone: (714) 544-6525.',
          ].join('\n'),
          html: confirmHtml,
        });
      } catch {
        /* internal notification already sent; the inquiry still succeeded */
      }
    }

    return json({ ok: true, queued: true });
  } catch {
    return json({ ok: false, error: 'Sending failed on our side. Call (714) 544-6525 and we will take it from there.' }, 502);
  }
};
