/* Compendium (Airtable) -> roster sync (build-time).

   When escrow staff change in the Compendium Airtable base, the site updates
   with zero human work. The build runs this first; it fetches the company's
   escrow staff, downloads headshots locally so astro:assets optimizes them,
   and writes src/data/roster.generated.json. The team pages prefer that
   generated data over the static fallback.

   Source (confirmed against the live base 2026-08-09):
   - Base appQIE0KXf4azH4jQ, table tblH0lEI2pMGO85FF (the master people table).
   - Staff are selected by Organization membership + Active status, NOT by view:
     the provided view returns the whole Seven Gables directory. Filter formula:
     AND(FIND("<org>", ARRAYJOIN({Organization})), {Status} = "Active").
   - The org defaults to "Alliance Mutual Escrow"; the AOE clone sets
     COMPENDIUM_ORG="Advantage One Escrow" and everything else is shared.
   - Field mapping: Name; Title (linked, e.g. "Escrow Officer | Team Laura",
     role and team split on "|"); SG Email; Phone; Corporate Headshot
     (attachment; Personal Headshot as fallback). A literal Airtable placeholder
     ("If empty, title from the people tab is used.") counts as no title.

   Safety and resilience:
   - No token -> skips cleanly; the static roster is used.
   - Any Airtable error is NON-FATAL: it logs and keeps the previous roster, so
     an outage or bad token never breaks a deploy.
   - Long-dash characters are sanitized out of all synced text (site hard rule).
   - The token is read from the environment only. Never commit it. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const IMG_DIR = path.join(__dirname, '..', 'src', 'assets', 'team', 'generated');
const OUT_JSON = path.join(DATA_DIR, 'roster.generated.json');

const CONFIG = {
  baseUrl: (process.env.COMPENDIUM_API_URL || 'https://api.airtable.com/v0/appQIE0KXf4azH4jQ').replace(/\/$/, ''),
  token: process.env.COMPENDIUM_API_TOKEN || '',
  tableId: process.env.COMPENDIUM_TABLE_ID || 'tblH0lEI2pMGO85FF',
  org: process.env.COMPENDIUM_ORG || 'Alliance Mutual Escrow',
};

const GROUP_ORDER = ['Leadership', 'Escrow Officers', 'Support', 'Office & Client Care'];
const TITLE_PLACEHOLDER = /if empty, title from the people tab/i;

/** Site hard rule: no long dashes anywhere, including synced data. */
const sanitize = (s) => String(s).replace(/\s*[—–―‒]\s*/g, ', ').replace(/\s+/g, ' ').trim();

const first = (v) => (Array.isArray(v) ? v[0] : v);

function parseTitle(fields) {
  let raw = first(fields['Title']);
  if (!raw || TITLE_PLACEHOLDER.test(String(raw))) raw = '';
  const [rolePart, teamPart] = String(raw).split('|').map((s) => s.trim());
  return {
    role: rolePart ? sanitize(rolePart) : 'Escrow Team',
    team: teamPart ? sanitize(teamPart) : undefined,
  };
}

function groupFor(role) {
  const r = role.toLowerCase();
  if (/general manager|manager|principal|owner/.test(r)) return 'Leadership';
  if (/officer/.test(r)) return 'Escrow Officers';
  if (/support|specialist|assistant|processor/.test(r)) return 'Support';
  return 'Office & Client Care';
}

function pickHeadshotUrl(fields) {
  for (const key of ['Corporate Headshot', 'Personal Headshot', 'Headshot', 'Photo']) {
    const v = fields[key];
    if (Array.isArray(v) && v[0] && v[0].url && String(v[0].type || 'image/').startsWith('image/')) return v[0].url;
  }
  return null;
}

const initials = (name) => name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function fetchAllRecords() {
  const records = [];
  let offset;
  do {
    const u = new URL(`${CONFIG.baseUrl}/${CONFIG.tableId}`);
    u.searchParams.set(
      'filterByFormula',
      `AND(FIND("${CONFIG.org}", ARRAYJOIN({Organization})) > 0, {Status} = "Active")`,
    );
    u.searchParams.set('pageSize', '100');
    u.searchParams.set('sort[0][field]', 'Name');
    u.searchParams.set('sort[0][direction]', 'asc');
    if (offset) u.searchParams.set('offset', offset);
    const res = await fetch(u, { headers: { Authorization: `Bearer ${CONFIG.token}`, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Airtable responded ${res.status} ${res.statusText}`);
    const body = await res.json();
    records.push(...(body.records || []));
    offset = body.offset;
  } while (offset);
  return records;
}

async function main() {
  if (!CONFIG.token) {
    console.log('[sync-roster] No Compendium token in env; using the static roster. Skipping.');
    return;
  }

  let records;
  try {
    records = await fetchAllRecords();
  } catch (err) {
    console.warn(`[sync-roster] NON-FATAL: ${err.message}. Keeping the existing roster.`);
    return;
  }

  const members = [];
  for (const rec of records) {
    const f = rec.fields || {};
    const rawName = f['Name'];
    if (!rawName) continue;
    const name = sanitize(rawName);
    // Company/brand records (logos, org entries) have Organization "Company".
    if ((f['Organization'] || []).includes('Company')) continue;
    const { role, team } = parseTitle(f);
    members.push({
      name,
      role,
      team,
      email: f['SG Email'] ? sanitize(f['SG Email']) : undefined,
      // "(714) 544-6525 | ext. 100" -> "(714) 544-6525 ext. 100"
      phone: f['Phone'] ? sanitize(f['Phone']).replace(/\s*\|\s*/g, ' ') : undefined,
      group: groupFor(role),
      headshotUrl: pickHeadshotUrl(f),
    });
  }

  if (members.length === 0) {
    console.warn('[sync-roster] NON-FATAL: zero usable staff records for org "' + CONFIG.org + '". Keeping the existing roster.');
    return;
  }

  members.sort((a, b) => {
    const g = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
    return g !== 0 ? g : a.name.localeCompare(b.name);
  });

  // Fresh headshot folder each run so removed staff leave no orphan images.
  fs.rmSync(IMG_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMG_DIR, { recursive: true });

  const out = [];
  for (const m of members) {
    const slug = slugify(m.name);
    let photoFile = null;
    if (m.headshotUrl) {
      try {
        const imgRes = await fetch(m.headshotUrl); // Airtable attachment URLs are pre-signed
        if (imgRes.ok) {
          const ext = (imgRes.headers.get('content-type') || '').includes('png') ? 'png' : 'jpg';
          photoFile = `${slug}.${ext}`;
          fs.writeFileSync(path.join(IMG_DIR, photoFile), Buffer.from(await imgRes.arrayBuffer()));
        }
      } catch (err) {
        console.warn(`[sync-roster] headshot for ${m.name} failed (${err.message}); using a monogram.`);
      }
    }
    out.push({
      name: m.name,
      initials: initials(m.name),
      role: m.role,
      tag: m.team,
      email: m.email,
      phone: m.phone,
      group: m.group,
      photoFile,
    });
  }

  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify({ source: 'compendium', org: CONFIG.org, syncedAt: new Date().toISOString(), members: out }, null, 2) + '\n',
  );
  console.log(`[sync-roster] Wrote ${out.length} active "${CONFIG.org}" staff to roster.generated.json.`);
}

main().catch((err) => {
  console.warn(`[sync-roster] NON-FATAL: ${err.message}. Keeping the existing roster.`);
});
