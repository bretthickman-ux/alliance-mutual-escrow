/* One distinct image per guide, shared by the guide pages (break image) and
   the library index (card art). Mix of licensed Adobe assets and Pexels
   (free license, commercial use, no attribution); see docs/IMAGERY-BRIEF.md. */

import imgFam from '../assets/home/fam.jpg';
import imgLake from '../assets/doors/agents.jpg';
import imgDusk from '../assets/doors/lenders.jpg';
import imgFoothills from '../assets/doors/investors.jpg';
import imgPark from '../assets/home/park.jpg';
import imgLagoon from '../assets/home/lagoon.jpg';
import imgKeysSold from '../assets/guides/keys-sold-sign.jpg';
import imgSigningCouple from '../assets/guides/signing-couple.jpg';
import imgShopOpen from '../assets/guides/shop-open.jpg';
import imgHouseTwilight from '../assets/guides/house-twilight.jpg';
import imgCraftsmanPorch from '../assets/guides/craftsman-porch.jpg';
import imgPorchChairs from '../assets/guides/porch-chairs.jpg';

export const GUIDE_IMAGES = {
  'what-escrow-does': imgCraftsmanPorch,
  'escrow-timeline': imgLake,
  'wire-fraud-safety': imgDusk,
  'buyer-guide': imgSigningCouple,
  'seller-guide': imgFam,
  'refinance-guide': imgHouseTwilight,
  '1031-exchange': imgFoothills,
  // A business changes hands: brandless boutique OPEN sign (Pexels 38519174).
  'bulk-sale': imgShopOpen,
  'probate': imgPorchChairs,
  'mobile-home': imgPark,
  'fsbo': imgKeysSold,
  // Calm held water, not a second keys photo next to the FSBO card.
  'holding-escrow': imgLagoon,
};

/** Rough read time from the guide's body text, floor of 2 minutes. */
export function readMinutes(guide) {
  const words = guide.sections
    .flatMap((s) => [s.h, ...s.ps])
    .concat(guide.faq.flatMap((f) => [f.q, f.a]))
    .join(' ')
    .split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}
