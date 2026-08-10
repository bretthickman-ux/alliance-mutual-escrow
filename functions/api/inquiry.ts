/* Cloudflare Pages Function: POST /api/inquiry
   Sends an Open-an-Escrow inquiry to the team via Resend. Nothing is stored;
   the message goes to INQUIRY_TO (default info@ameescrow.com) and that is the
   whole lifecycle. The honeypot field silently succeeds for bots. */

interface InquiryRequest {
  role: string;
  city: string;
  timing: string;
  name: string;
  contact: string;
  company?: string; // honeypot
}

export const onRequestPost: PagesFunction<{
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  INQUIRY_TO?: string;
}> = async (context) => {
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
    return json({ ok: false, error: 'Add your name so your officer knows who to ask for.' }, 400);
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

  const clean = (s: string) => String(s).slice(0, 200).replace(/[\r\n]+/g, ' ');
  const text = [
    'New escrow inquiry from the website',
    '',
    `Who:      ${clean(body.name)}`,
    `Reach at: ${clean(contact)}`,
    `Role:     ${clean(body.role)}`,
    `Property: ${clean(body.city)}`,
    `Timeline: ${clean(body.timing)}`,
    '',
    'Reply directly to the contact above.',
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'Alliance Mutual Escrow <onboarding@resend.dev>',
        to: [env.INQUIRY_TO || 'info@ameescrow.com'],
        subject: `Escrow inquiry: ${clean(body.name)} · ${clean(body.role)}`,
        text,
      }),
    });
    if (!res.ok) throw new Error('Resend ' + res.status);
    return json({ ok: true, queued: true });
  } catch {
    return json({ ok: false, error: 'Sending failed on our side. Call (714) 544-6525 and we will take it from there.' }, 502);
  }
};
