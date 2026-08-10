/* Cloudflare Pages Function: POST /api/email-pdf
   Accepts a calculator summary and an email address, and hands it to an email
   provider. The provider is stubbed behind an interface so we can pick one
   later (Resend, Postmark, MailChannels, SES) by setting EMAIL_PROVIDER and its
   credentials in the Pages environment; no client change needed.

   Anonymous by design: the email address is used to send one message and is not
   stored anywhere by this function. */

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

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

interface EmailProvider {
  readonly name: string;
  send(msg: EmailMessage): Promise<{ queued: boolean; note?: string }>;
}

/** No provider configured yet: acknowledge honestly, send nothing. */
const nullProvider: EmailProvider = {
  name: 'none',
  async send() {
    return {
      queued: false,
      note: 'Email sending is not connected yet. Print the page or copy the link instead.',
    };
  },
};

/** Resend (https://resend.com): HTTPS API, the right fit for Pages Functions
    (no SMTP available at the edge). Sender falls back to Resend's onboarding
    address until the ameescrow.com domain is verified. */
function resendProvider(env: Record<string, unknown>): EmailProvider {
  return {
    name: 'resend',
    async send(msg) {
      const from = (env.EMAIL_FROM as string) || 'Alliance Mutual Escrow <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text }),
      });
      if (!res.ok) throw new Error('Resend ' + res.status);
      return { queued: true };
    },
  };
}

// Providers are selected by env.EMAIL_PROVIDER; adding one never touches the client.
function providerFor(env: Record<string, unknown>): EmailProvider {
  if (env.EMAIL_PROVIDER === 'resend' && env.RESEND_API_KEY) return resendProvider(env);
  return nullProvider;
}

const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

function renderText(req: EmailRequest): string {
  const title = req.mode === 'refinance' ? 'Refinance estimate' : req.mode === 'seller' ? 'Seller estimate' : 'Buyer estimate';
  const rows = (req.lines || []).map((l) => `  ${l.label}: ${usd(l.amount)}`).join('\n');
  return [
    'Alliance Mutual Escrow',
    title + ' for ' + usd(req.amount),
    '',
    rows,
    req.total != null ? `  Total escrow side: ${usd(req.total)}` : '',
    '',
    'Computed from the published fee schedule. Third-party costs are not included.',
    'Questions? Call (714) 544-6525.',
  ].filter(Boolean).join('\n');
}

export const onRequestPost: PagesFunction = async (context) => {
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

  const provider = providerFor(context.env as Record<string, unknown>);
  try {
    const result = await provider.send({
      to: body.email,
      subject: 'Your escrow fee estimate from Alliance Mutual Escrow',
      text: renderText(body),
    });
    return json({ ok: true, provider: provider.name, ...result });
  } catch {
    return json({ ok: false, error: 'Sending failed on our side. Print the page instead, or call (714) 544-6525.' }, 502);
  }
};
