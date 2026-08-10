/* Cloudflare Pages Function: POST /api/email-pdf
   Emails a calculator estimate. Two sends per request (IT guidance):
   1. Branded estimate to the visitor.
   2. A separate internal notification to the team list (NOTIFY_TO), so the
      officers see what estimates are going out. No mailbox or distro needed.

   Anonymous by design: the email address is used to send and is not stored. */

import { brandHtml, rowsHtml, notifyList, type SendEnv, resendSend } from './_lib/email';
import { logLead, type LeadsEnv } from './_lib/leads';

interface SummaryLine {
  label: string;
  amount: number;
}

interface EmailRequest {
  email: string;
  mode: 'buyer' | 'seller' | 'refinance';
  amount: number;
  lines?: SummaryLine[];
  total?: number;
}

const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

const titleFor = (mode: EmailRequest['mode']) =>
  mode === 'refinance' ? 'Refinance estimate' : mode === 'seller' ? 'Seller estimate' : 'Buyer estimate';

function renderText(req: EmailRequest): string {
  const rows = (req.lines || []).map((l) => `  ${l.label}: ${usd(l.amount)}`).join('\n');
  return [
    'Alliance Mutual Escrow',
    titleFor(req.mode) + ' for ' + usd(req.amount),
    '',
    rows,
    req.total != null ? `  Total escrow side: ${usd(req.total)}` : '',
    '',
    'Computed from the published fee schedule. Third-party costs are not included.',
    'Questions? Call (714) 544-6525.',
  ].filter(Boolean).join('\n');
}

function renderHtml(req: EmailRequest): string {
  const rows = (req.lines || []).map((l) => ({ label: l.label, value: usd(l.amount) }));
  if (req.total != null) rows.push({ label: 'Total escrow side', value: usd(req.total), strong: true } as never);
  return brandHtml({
    kicker: titleFor(req.mode),
    heading: `Your estimate for ${usd(req.amount)}`,
    intro: 'Computed from our published fee schedule. Third-party costs like title, lender, and county charges are not included.',
    bodyHtml: rowsHtml(rows as Array<{ label: string; value: string; strong?: boolean }>),
    footNote: 'Estimates are informational and not a quote or a fee agreement. Your escrow officer confirms exact figures when your file opens. Questions? Call (714) 544-6525.',
  });
}

export const onRequestPost: PagesFunction<SendEnv & LeadsEnv & { EMAIL_PROVIDER?: string }> = async (context) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  let body: EmailRequest;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'Could not read that request. Try again.' }, 400);
  }

  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return json({ ok: false, error: 'Enter an email like name@example.com and try again.' }, 400);
  }
  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return json({ ok: false, error: 'That estimate looks empty. Enter an amount first.' }, 400);
  }

  const env = context.env;
  if (env.EMAIL_PROVIDER !== 'resend' || !env.RESEND_API_KEY) {
    return json({
      ok: true,
      provider: 'none',
      queued: false,
      note: 'Email sending is not connected yet. Print the page or copy the link instead.',
    });
  }

  // Paper trail first (per IT: log to the DB, then email). Best-effort.
  await logLead(env, {
    Type: 'Estimate',
    Contact: body.email,
    Amount: Math.round(body.amount),
    Summary: `${titleFor(body.mode)} for ${usd(body.amount)}${body.total != null ? `, escrow side ${usd(body.total)}` : ''}`,
  });

  try {
    await resendSend(env, {
      to: [body.email],
      subject: 'Your escrow fee estimate from Alliance Mutual Escrow',
      text: renderText(body),
      html: renderHtml(body),
    });

    // Internal heads-up; never fails the visitor's request.
    try {
      await resendSend(env, {
        to: notifyList(env),
        subject: `Estimate emailed: ${titleFor(body.mode)} for ${usd(body.amount)}`,
        text: [`An estimate was emailed from the website calculator.`, '', renderText(body)].join('\n'),
      });
    } catch {
      /* visitor email already queued */
    }

    return json({ ok: true, provider: 'resend', queued: true });
  } catch {
    return json({ ok: false, error: 'Sending failed on our side. Print the page instead, or call (714) 544-6525.' }, 502);
  }
};
