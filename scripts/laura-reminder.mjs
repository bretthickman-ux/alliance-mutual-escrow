/* Daily reminder to Laura until her site review arrives.

   Run by a scheduled task. Checks the Website Leads base for a
   "Laura Review" record (written by /api/review-digest when she hits Send
   to Brett); if none exists, emails her a friendly nudge via Resend and
   CCs Brett. Exits 0 with a clear status line either way.

   Secrets come from ../COMPENDIUM.env next to the repo; nothing is stored
   here. Delete the scheduled task (or this prints DONE forever) once she
   has responded through any channel. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = path.join(root, '..', 'COMPENDIUM.env');
const env = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]),
);

const LEADS_BASE = 'appN5KR0LT9Z88o3F';
const LEADS_TABLE = 'tblACmnestsdTYAvk';
const LAURA = 'lauraw@ameescrow.com';
const BRETT = 'bretth@sevengables.com';
const LINK = 'https://alliance-mutual-escrow.pages.dev/calculator/?laura=1';

const done = await fetch(
  `https://api.airtable.com/v0/${LEADS_BASE}/${LEADS_TABLE}?filterByFormula=${encodeURIComponent(`{Type}="Laura Review"`)}&maxRecords=1`,
  { headers: { Authorization: `Bearer ${env.LEADS_API_TOKEN}` } },
).then((r) => r.json()).then((j) => (j.records || []).length > 0).catch(() => false);

if (done) {
  console.log('DONE: Laura already sent her review. No reminder sent; this schedule can be removed.');
  process.exit(0);
}

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: env.EMAIL_FROM || 'Alliance Mutual Escrow <estimates@ameescrow.com>',
    to: [LAURA],
    cc: [BRETT],
    reply_to: BRETT,
    subject: 'Friendly nudge: the new AME website is waiting on your eyes',
    text: [
      'Hi Laura,',
      '',
      'Just a gentle reminder about the new website review, whenever you have',
      'twenty minutes. The link walks you through the fees, the calculator, and',
      'each guide one page at a time; every line has its own quick check or',
      '"needs change" button, and "Send to Brett" delivers it all at once (you',
      'can attach the current rate sheet too).',
      '',
      LINK,
      '',
      'Thank you!',
      'Brett',
    ].join('\n'),
  }),
});
console.log(res.ok ? `REMINDER SENT to ${LAURA} (cc ${BRETT}).` : `SEND FAILED: Resend ${res.status}`);
