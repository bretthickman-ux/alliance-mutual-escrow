/* One-shot: reconcile Compendium titles with Laura Woodbury's roster email
   (2026-08-06, authoritative per Brett). Team suffixes ("| Team X") are
   preserved because the site renders them as tags.

   The Title field read back as an array, so it may be a lookup whose writable
   source lives elsewhere. Strategy:
   1. Try the metadata API for the schema (needs schema.bases:read).
   2. Try a direct PATCH of {Title: "..."} on one record.
   3. If Airtable rejects Title as computed, report exactly which field is the
      writable source so the token scope or approach can be adjusted.

   Requires COMPENDIUM_API_TOKEN with data.records:write. Reads env only. */

const BASE = 'https://api.airtable.com/v0/appQIE0KXf4azH4jQ';
const META = 'https://api.airtable.com/v0/meta/bases/appQIE0KXf4azH4jQ';
const TABLE = 'tblH0lEI2pMGO85FF';
const TOKEN = process.env.COMPENDIUM_API_TOKEN;

// Laura's titles, with team suffixes preserved from current Compendium data.
const UPDATES = [
  { name: 'Sylvia Vaca', title: 'Residential and Bulk Sale Escrow Assistant' },
  { name: 'Michelle Weber', title: 'Office Administrator' },
  { name: 'Jeannette Urquijo', title: 'Escrow Assistant | Team Laura' },
  { name: 'Erin Hendrickson', title: 'Escrow Assistant | Team Heather' },
  { name: 'Katie Macias', title: 'Residential and Bulk Sale Escrow Officer | Team Laura' },
  { name: 'Yolanda Linan', title: 'Sales and Marketing Executive' },
];

const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function main() {
  if (!TOKEN) { console.log('RESULT:NO_TOKEN'); return; }

  // Schema peek (optional; tells us if Title is computed and what its source is).
  try {
    const res = await fetch(`${META}/tables`, { headers: H });
    if (res.ok) {
      const meta = await res.json();
      const t = meta.tables.find((x) => x.id === TABLE);
      const title = t?.fields.find((f) => f.name === 'Title');
      console.log('SCHEMA: Title type =', title?.type, JSON.stringify(title?.options || {}).slice(0, 200));
      if (title?.type === 'multipleLookupValues' || title?.type === 'rollup' || title?.type === 'formula') {
        const src = title.options?.fieldIdInLinkedTable
          ? `lookup via link ${title.options.recordLinkFieldId} -> field ${title.options.fieldIdInLinkedTable}`
          : 'computed';
        console.log('RESULT:TITLE_COMPUTED', src);
        // Find the linked table + writable field name for the report.
        if (title.options?.recordLinkFieldId) {
          const link = t.fields.find((f) => f.id === title.options.recordLinkFieldId);
          const linkedTable = meta.tables.find((x) => x.id === link?.options?.linkedTableId);
          const srcField = linkedTable?.fields.find((f) => f.id === title.options.fieldIdInLinkedTable);
          console.log('SOURCE:', linkedTable?.name, '::', srcField?.name, '(type', srcField?.type + ')');
          // Attempt writing the source field on the linked records instead.
          await writeViaLinkedTable(link.name, linkedTable, srcField);
          return;
        }
        return;
      }
    } else {
      console.log('SCHEMA: meta not readable (' + res.status + '), probing directly');
    }
  } catch (e) {
    console.log('SCHEMA: peek failed,', e.message);
  }

  // Direct attempt on the people table.
  for (const u of UPDATES) {
    const q = new URL(`${BASE}/${TABLE}`);
    q.searchParams.set('filterByFormula', `{Name} = "${u.name}"`);
    q.searchParams.set('maxRecords', '3');
    const found = await (await fetch(q, { headers: H })).json();
    const rec = (found.records || []).find((r) => (r.fields.Organization || []).includes('Alliance Mutual Escrow')) || found.records?.[0];
    if (!rec) { console.log('MISS:', u.name); continue; }
    const res = await fetch(`${BASE}/${TABLE}/${rec.id}`, {
      method: 'PATCH', headers: H, body: JSON.stringify({ fields: { Title: u.title } }),
    });
    const body = await res.json().catch(() => ({}));
    console.log(res.ok ? 'OK:' : `FAIL(${res.status}):`, u.name, res.ok ? '' : JSON.stringify(body.error || {}).slice(0, 160));
    if (res.status === 401 || res.status === 403) { console.log('RESULT:AUTH_INSUFFICIENT'); return; }
  }
  console.log('RESULT:DONE_DIRECT');
}

async function writeViaLinkedTable(linkFieldName, linkedTable, srcField) {
  if (!linkedTable || !srcField) { console.log('RESULT:SOURCE_UNRESOLVED'); return; }
  for (const u of UPDATES) {
    // Find the person, follow their link, patch the linked record's source field.
    const q = new URL(`${BASE}/${TABLE}`);
    q.searchParams.set('filterByFormula', `{Name} = "${u.name}"`);
    const found = await (await fetch(q, { headers: H })).json();
    const rec = (found.records || []).find((r) => (r.fields.Organization || []).includes('Alliance Mutual Escrow')) || found.records?.[0];
    const linkedIds = rec?.fields?.[linkFieldName];
    if (!rec || !Array.isArray(linkedIds) || linkedIds.length === 0) { console.log('MISS-LINK:', u.name); continue; }
    const res = await fetch(`${BASE}/${linkedTable.id}/${linkedIds[0]}`, {
      method: 'PATCH', headers: H, body: JSON.stringify({ fields: { [srcField.name]: u.title } }),
    });
    const body = await res.json().catch(() => ({}));
    console.log(res.ok ? 'OK-LINKED:' : `FAIL-LINKED(${res.status}):`, u.name, res.ok ? '' : JSON.stringify(body.error || {}).slice(0, 160));
    if (res.status === 401 || res.status === 403) { console.log('RESULT:AUTH_INSUFFICIENT'); return; }
  }
  console.log('RESULT:DONE_LINKED');
}

main().catch((e) => console.log('RESULT:ERROR', e.message));
