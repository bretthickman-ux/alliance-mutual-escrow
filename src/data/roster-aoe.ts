/* Advantage One Escrow roster, preserved for the Phase 5 clone (HANDOFF
   section 5, from the comment inside deploy_m/team.html). Portraits already
   live in src/assets/team/. Not rendered by the AME build; it exists now so
   the clone is a data swap, not a re-derivation. All assignments unconfirmed
   until the clone phase. */

import type { ImageMetadata } from 'astro';
import type { Member, RosterGroup } from './roster';

import tinaSung from '../assets/team/tina-sung.jpg';
import lauraBaughman from '../assets/team/laura-baughman.jpg';
import lisaWoolley from '../assets/team/lisa-woolley.jpg';
import amyKim from '../assets/team/amy-kim.jpg';
import margoValance from '../assets/team/margo-valance.jpg';
import cindyBabineau from '../assets/team/cindy-babineau.jpg';

type AoeMember = Member & { team?: string; photo?: ImageMetadata };

export const rosterAoe: AoeMember[] = [
  { name: 'Tina Sung', initials: 'TS', role: 'Manager · Escrow Officer', photo: tinaSung, group: 'Leadership', pending: true },
  { name: 'Laura Baughman', initials: 'LB', role: 'Escrow Officer', team: 'Team Tina', photo: lauraBaughman, group: 'Escrow Officers', pending: true },
  { name: 'Lisa Woolley', initials: 'LW', role: 'Escrow Officer', team: 'Team Lisa', photo: lisaWoolley, group: 'Escrow Officers', pending: true },
  { name: 'Amy Kim', initials: 'AK', role: 'Support Specialist', team: 'Team Lisa', photo: amyKim, group: 'Support', pending: true },
  { name: 'Margo Valance', initials: 'MV', role: 'Escrow Officer', team: 'Team Margo', photo: margoValance, group: 'Escrow Officers', pending: true },
  { name: 'Cindy Babineau', initials: 'CB', role: 'Escrow Officer', team: 'Team Margo', photo: cindyBabineau, group: 'Escrow Officers', pending: true },
  { name: 'Sandy Padilla', initials: 'SP', role: 'Escrow Officer · Leisure World', group: 'Escrow Officers', pending: true },
  { name: 'Agnes Bugarin', initials: 'AB', role: 'Escrow Team', group: 'Support', pending: true },
  { name: 'Rose Moreno', initials: 'RM', role: 'Escrow Team', group: 'Support', pending: true },
];

export const _groupOrderRef: RosterGroup[] = ['Leadership', 'Escrow Officers', 'Support', 'Office & Client Care'];
