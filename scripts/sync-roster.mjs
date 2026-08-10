/* Compendium -> roster sync (build-time).

   Goal: when escrow staff (and their headshots) change in Compendium, the site
   updates automatically with zero human work. The build runs this first; it
   fetches escrow staff from Compendium, downloads their headshots locally so
   astro:assets can optimize them, and writes src/data/roster.generated.json.
   The team pages prefer that generated data over the static fallback.

   Safety and resilience:
   - No credentials -> skips cleanly and the static roster is used. Local dev and
     the current build keep working unchanged.
   - Any Compendium error is NON-FATAL: it logs and leaves the previous roster in
     place, so an outage or a bad response never breaks a deploy.
   - The token is read from the environment only. Never commit it.

   >>> TODO(Brett): fill in the four CONFIG values + mapField() once we have the
       Compendium API details. Everything around them is done. <<< */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const IMG_DIR = path.join(__dirname, '..', 'src', 'assets', 'team', 'generated');
const OUT_JSON = path.join(DATA_DIR, 'roster.generated.json');

// ── CONFIG: to confirm with Brett / Compendium API docs ─────────────────────
const CONFIG = {
  // Base URL of the Compendium API, e.g. 'https://api.compendium.example/v1'.
  baseUrl: process.env.COMPENDIUM_API_URL || '',
  // Bearer token, secret. Set as a Cloudflare Pages / CI env var, never in repo.
  token: process.env.COMPENDIUM_API_TOKEN || '',
  // The endpoint + query that returns AME escrow staff. TODO: confirm path and
  // how "escrow staff" is filtered (a department field? a table/collection?).
  staffPath: process.env.COMPENDIUM_STAFF_PATH || '/people?group=escrow-staff',
};

// Map one Compendium record to the site's Member shape. TODO: confirm field
// names (name / role / email / headshot / group). Kept defensive: a record that
// is missing a name is skipped rather than rendered blank.
function mapRecord(rec) {
  const name = rec.name || rec.full_name || rec.displayName;
  if (!name) return null;
  return {
    name,
    role: rec.role || rec.title || 'Escrow Officer',
    tag: rec.specialty || rec.tag || undefined,
    email: rec.email || undefined,
    group: rec.group || 'Escrow Officers',
    headshotUrl: rec.headshot_url || rec.photo || rec.avatar || null,
  };
}

function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  if (!CONFIG.baseUrl || !CONFIG.token) {
    console.log('[sync-roster] No Compendium credentials in env; using the static roster. Skipping.');
    return;
  }

  let records;
  try {
    const res = await fetch(CONFIG.baseUrl.replace(/\/$/, '') + CONFIG.staffPath, {
      headers: { Authorization: `Bearer ${CONFIG.token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Compendium responded ${res.status} ${res.statusText}`);
    const body = await res.json();
    // TODO: confirm the response envelope. Handles a bare array or {data:[...]} / {records:[...]}.
    records = Array.isArray(body) ? body : body.data || body.records || body.people || [];
    if (!Array.isArray(records)) throw new Error('Could not find a records array in the Compendium response');
  } catch (err) {
    console.warn(`[sync-roster] NON-FATAL: ${err.message}. Keeping the existing roster.`);
    return;
  }

  const members = records.map(mapRecord).filter(Boolean);
  if (members.length === 0) {
    console.warn('[sync-roster] NON-FATAL: Compendium returned zero usable staff records. Keeping the existing roster.');
    return;
  }

  fs.mkdirSync(IMG_DIR, { recursive: true });
  const out = [];
  for (const m of members) {
    const slug = slugify(m.name);
    let photoFile = null;
    if (m.headshotUrl) {
      try {
        const imgRes = await fetch(m.headshotUrl, { headers: { Authorization: `Bearer ${CONFIG.token}` } });
        if (imgRes.ok) {
          const ext = (imgRes.headers.get('content-type') || '').includes('png') ? 'png' : 'jpg';
          photoFile = `${slug}.${ext}`;
          const buf = Buffer.from(await imgRes.arrayBuffer());
          fs.writeFileSync(path.join(IMG_DIR, photoFile), buf);
        }
      } catch (err) {
        console.warn(`[sync-roster] headshot for ${m.name} failed (${err.message}); using a monogram.`);
      }
    }
    out.push({
      name: m.name,
      initials: initials(m.name),
      role: m.role,
      tag: m.tag,
      email: m.email,
      group: m.group,
      photoFile, // resolved to an optimized image by src/data/roster.ts via import.meta.glob
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify({ source: 'compendium', synced: true, members: out }, null, 2) + '\n');
  console.log(`[sync-roster] Wrote ${out.length} staff from Compendium to roster.generated.json.`);
}

main().catch((err) => {
  console.warn(`[sync-roster] NON-FATAL: ${err.message}. Keeping the existing roster.`);
});
