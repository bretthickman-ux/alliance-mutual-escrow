/* Compendium (Airtable) -> roster sync (build-time).

   Goal: when escrow staff (and their headshots) change in the Compendium
   Airtable base, the site updates automatically with zero human work. The build
   runs this first; it fetches escrow staff from the curated Airtable view,
   downloads their headshots locally so astro:assets can optimize them, and
   writes src/data/roster.generated.json. The team pages prefer that generated
   data over the static fallback.

   Source: Airtable base appQIE0KXf4azH4jQ, table tblH0lEI2pMGO85FF, curated view
   viwqx0nVK1xbcE4sV. Auth is a Personal Access Token (data.records:read scope on
   this base) sent as `Authorization: Bearer <token>`.

   Safety and resilience:
   - No credentials -> skips cleanly; the static roster is used. Local dev and the
     current build keep working unchanged.
   - Any Airtable error (including an expired/legacy token) is NON-FATAL: it logs
     and leaves the previous roster in place, so an outage never breaks a deploy.
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
  viewId: process.env.COMPENDIUM_VIEW_ID || 'viwqx0nVK1xbcE4sV',
};

const GROUPS = ['Leadership', 'Escrow Officers', 'Support', 'Office & Client Care'];

// Case-insensitive lookup across candidate column names.
function pick(fields, candidates) {
  const map = new Map(Object.keys(fields).map((k) => [k.toLowerCase(), k]));
  for (const c of candidates) {
    const hit = map.get(c.toLowerCase());
    if (hit != null && fields[hit] !== '' && fields[hit] != null) return fields[hit];
  }
  return undefined;
}

// Find the first attachment field that holds an image, regardless of its name.
function pickHeadshot(fields) {
  const named = pick(fields, ['Headshot', 'Photo', 'Headshot Photo', 'Portrait', 'Image', 'Picture', 'Avatar']);
  const asUrl = (v) => (Array.isArray(v) && v[0] && v[0].url ? v[0].url : null);
  if (named && asUrl(named)) return asUrl(named);
  for (const v of Object.values(fields)) {
    if (Array.isArray(v) && v[0] && typeof v[0] === 'object' && v[0].url && String(v[0].type || '').startsWith('image/')) {
      return v[0].url;
    }
  }
  return null;
}

// Normalize whatever the base calls the grouping into our four display groups.
function normalizeGroup(rawGroup, role) {
  const g = String(rawGroup || '').trim();
  const exact = GROUPS.find((x) => x.toLowerCase() === g.toLowerCase());
  if (exact) return exact;
  const r = `${g} ${role || ''}`.toLowerCase();
  if (/manager|principal|owner|lead\b/.test(r)) return 'Leadership';
  if (/officer/.test(r)) return 'Escrow Officers';
  if (/assistant|support|specialist|processor/.test(r)) return 'Support';
  if (/front desk|reception|marketing|sales|admin|client care/.test(r)) return 'Office & Client Care';
  return 'Escrow Officers';
}

function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function fetchAllRecords() {
  const records = [];
  let offset;
  do {
    const u = new URL(`${CONFIG.baseUrl}/${CONFIG.tableId}`);
    u.searchParams.set('view', CONFIG.viewId);
    u.searchParams.set('pageSize', '100');
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
    const fields = rec.fields || {};
    const name = pick(fields, ['Name', 'Full Name', 'Staff Name', 'Display Name']);
    if (!name) continue;
    const role = pick(fields, ['Role', 'Title', 'Position', 'Job Title']) || 'Escrow Officer';
    members.push({
      name: String(name),
      role: String(role),
      tag: pick(fields, ['Specialty', 'Tag', 'Specialties', 'Focus']),
      email: pick(fields, ['Email', 'Email Address', 'Work Email']),
      group: normalizeGroup(pick(fields, ['Group', 'Team', 'Department', 'Category']), role),
      headshotUrl: pickHeadshot(fields),
    });
  }

  if (members.length === 0) {
    console.warn('[sync-roster] NON-FATAL: Airtable returned zero usable staff records (check the view and column names). Keeping the existing roster.');
    return;
  }

  // Fresh headshot folder each run so removed staff do not leave orphan images.
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
      tag: m.tag ? String(m.tag) : undefined,
      email: m.email ? String(m.email) : undefined,
      group: m.group,
      photoFile,
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify({ source: 'compendium', synced: true, members: out }, null, 2) + '\n');
  console.log(`[sync-roster] Wrote ${out.length} staff from Compendium (Airtable) to roster.generated.json.`);
}

main().catch((err) => {
  console.warn(`[sync-roster] NON-FATAL: ${err.message}. Keeping the existing roster.`);
});
