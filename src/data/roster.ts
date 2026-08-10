/* Roster data (HANDOFF section 5). Confirmed via Brett's Airtable; emails from
   the old site are facts only. Both team pages (photo wall + typographic index)
   read this one array, so the AOE clone is a roster swap.

   Unconfirmed items carry `pending: true` and are documented in HANDOFF
   section 8. They still render (the mockup shows them), but the flag lets a
   later pass surface or hold them without hunting through markup. */

import type { ImageMetadata } from 'astro';

import lauraWoodbury from '../assets/team/laura-woodbury.jpg';
import katieMacias from '../assets/team/katie-macias.jpg';
import heatherLambaren from '../assets/team/heather-stovall-lambaren.jpg';
import jeannetteUrquijo from '../assets/team/jeannette-urquijo.jpg';
import erinHendrickson from '../assets/team/erin-hendrickson.jpg';
import julieBasurto from '../assets/team/julie-basurto.jpg';
import yolandaLinan from '../assets/team/yolanda-linan.jpg';

export type RosterGroup = 'Leadership' | 'Escrow Officers' | 'Support' | 'Office & Client Care';

export interface Member {
  name: string;
  initials: string;
  /** Primary role line. May wrap onto two lines with a <br>-equivalent split. */
  role: string;
  roleLines?: string[];
  /** Optional specialty/team tag (e.g. "Residential · Bulk Sale", "Team Laura"). */
  tag?: string;
  email?: string;
  /** Direct phone, as displayed (synced from Compendium). */
  phone?: string;
  photo?: ImageMetadata;
  group: RosterGroup;
  /** Airtable / assignment not fully confirmed; see HANDOFF section 8. */
  pending?: boolean;
}

export const groupOrder: RosterGroup[] = [
  'Leadership',
  'Escrow Officers',
  'Support',
  'Office & Client Care',
];

/* Static, confirmed AME roster. This is the fallback and the current source of
   truth until the Compendium sync is live (see scripts/sync-roster.mjs and the
   compendium-roster-sync memory). When the sync writes roster.generated.json,
   that data wins; see the resolution block below. */
const staticRoster: Member[] = [
  {
    name: 'Laura Woodbury',
    initials: 'LW',
    role: 'Escrow General Manager · Escrow Officer',
    roleLines: ['Escrow General Manager', 'Escrow Officer'],
    email: 'lauraw@ameescrow.com',
    photo: lauraWoodbury,
    group: 'Leadership',
  },
  {
    name: 'Katie Macias',
    initials: 'KM',
    role: 'Escrow Officer',
    tag: 'Residential · Bulk Sale',
    email: 'katiem@ameescrow.com',
    photo: katieMacias,
    group: 'Escrow Officers',
  },
  {
    name: 'Heather Stovall-Lambaren',
    initials: 'HS',
    role: 'Escrow Officer',
    email: 'heatherl@ameescrow.com',
    photo: heatherLambaren,
    group: 'Escrow Officers',
  },
  {
    name: 'Jhana Duncan',
    initials: 'JD',
    role: 'Escrow Officer',
    email: 'jhanad@ameescrow.com',
    group: 'Escrow Officers',
    pending: true,
  },
  {
    name: 'Sylvia Vaca',
    initials: 'SV',
    role: 'Escrow Officer',
    group: 'Escrow Officers',
  },
  {
    name: 'Jeannette Urquijo',
    initials: 'JU',
    role: 'Support Specialist',
    email: 'teamlauraclosing@ameescrow.com',
    photo: jeannetteUrquijo,
    group: 'Support',
  },
  {
    name: 'Erin Hendrickson',
    initials: 'EH',
    role: 'Support Specialist',
    email: 'erinh@ameescrow.com',
    photo: erinHendrickson,
    group: 'Support',
  },
  {
    name: 'Michelle Weber',
    initials: 'MW',
    role: 'Front Desk Supervisor',
    group: 'Office & Client Care',
    pending: true,
  },
  {
    name: 'Julie Basurto',
    initials: 'JB',
    role: 'Escrow Assistant',
    photo: julieBasurto,
    group: 'Office & Client Care',
    pending: true,
  },
  {
    name: 'Yolanda Linan',
    initials: 'YL',
    role: 'Sales & Marketing Account Executive',
    roleLines: ['Sales & Marketing', 'Account Executive'],
    email: 'yolandal@ameescrow.com',
    photo: yolandaLinan,
    group: 'Office & Client Care',
  },
];

/* ── Compendium-generated roster (optional, wins when present) ────────────────
   scripts/sync-roster.mjs writes roster.generated.json and downloads headshots
   to assets/team/generated/. These globs resolve to nothing when the sync has
   not run, so the static roster above is used. When the sync has run, the
   generated staff replace it automatically, headshots optimized like any asset. */
type GeneratedMember = {
  name: string; initials: string; role: string; tag?: string;
  email?: string; phone?: string; group: RosterGroup; photoFile: string | null;
};

const generatedModules = import.meta.glob<{ default: { members: GeneratedMember[] } }>(
  './roster.generated.json',
  { eager: true },
);
const generatedHeadshots = import.meta.glob<ImageMetadata>(
  '../assets/team/generated/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' },
);

function resolveHeadshot(file: string | null): ImageMetadata | undefined {
  if (!file) return undefined;
  const entry = Object.entries(generatedHeadshots).find(([p]) => p.endsWith('/' + file));
  return entry ? entry[1] : undefined;
}

const generatedRoster: Member[] | null = (() => {
  const mod = Object.values(generatedModules)[0];
  const members = mod?.default?.members;
  if (!members || members.length === 0) return null;
  return members.map((m) => ({
    name: m.name,
    initials: m.initials,
    role: m.role,
    tag: m.tag,
    email: m.email,
    phone: m.phone,
    group: m.group,
    photo: resolveHeadshot(m.photoFile),
  }));
})();

/** The roster the site renders: Compendium-synced when available, else static. */
/* Owner exclusions (Mike, review pass 4, 2026-08-10): these people stay off
   the website roster regardless of Compendium status. Ask Ryan to drop them
   from the AME view too, which makes this list redundant belt-and-suspenders. */
const EXCLUDE_NAMES = new Set(['Sue Knox', 'Wendy Roman']);

export const roster: Member[] = (generatedRoster ?? staticRoster).filter(
  (m) => !EXCLUDE_NAMES.has(m.name),
);

/** Where the current roster came from, for diagnostics. */
export const rosterSource: 'compendium' | 'static' = generatedRoster ? 'compendium' : 'static';

/** tel: href for a display phone, handling extensions ("ext. 100" -> ,100 pause-dial). */
export function telHref(phone: string): string {
  const ext = phone.match(/(?:ext\.?|x)\s*(\d+)/i);
  const base = phone.replace(/(?:ext\.?|x)\s*\d+.*$/i, '').replace(/\D/g, '');
  return 'tel:' + base + (ext ? ',' + ext[1] : '');
}

/** Members grouped in display order. */
export function rosterByGroup(): { group: RosterGroup; members: Member[] }[] {
  return groupOrder
    .map((group) => ({ group, members: roster.filter((m) => m.group === group) }))
    .filter((g) => g.members.length > 0);
}
