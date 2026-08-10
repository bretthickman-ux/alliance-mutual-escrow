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
  /** Optional specialty tag (e.g. "Residential · Bulk Sale"). */
  tag?: string;
  email?: string;
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

export const roster: Member[] = [
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

/** Members grouped in display order, for the typographic index (team-b). */
export function rosterByGroup(): { group: RosterGroup; members: Member[] }[] {
  return groupOrder
    .map((group) => ({ group, members: roster.filter((m) => m.group === group) }))
    .filter((g) => g.members.length > 0);
}
