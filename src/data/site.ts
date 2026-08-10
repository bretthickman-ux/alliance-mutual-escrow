/* Company / contact facts. The AOE clone swaps this file plus roster + theme
   tokens; the component library stays put. Facts only (HANDOFF section 1). */

export interface SiteConfig {
  /** Brand id, used to pick the theme class on <html>. */
  brand: 'ame' | 'aoe';
  name: string;
  shortName: string;
  kicker: string;
  address: { line1: string; city: string; state: string; zip: string };
  phone: { display: string; href: string };
  email: string;
}

export const site: SiteConfig = {
  brand: 'ame',
  name: 'Alliance Mutual Escrow',
  shortName: 'Tustin · CA',
  kicker: 'DFPI LICENSED',
  address: { line1: '12681 Newport Ave', city: 'Tustin', state: 'CA', zip: '92780' },
  phone: { display: '(714) 544-6525', href: 'tel:7145446525' },
  email: 'info@ameescrow.com',
};

/** Flat nav, identical on every page (HANDOFF section 3). No dropdowns. */
export const navLinks = [
  { label: 'Services', href: '/#services' },
  { label: 'Guides', href: '/guides' },
  { label: 'Team', href: '/team' },
  { label: 'Calculator', href: '/calculator' },
  { label: site.phone.display, href: site.phone.href },
];

/** Legal and policy set, shown in the deep footer's mono bottom row. */
export const legalLinks = [
  { label: 'Consumer feedback', href: '/consumer-feedback' },
  { label: 'Complaint policy', href: '/complaint-policy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Resources', href: '/resources' },
];

/** Audience pages, used by the mobile menu and the footer "Escrow for" column. */
export const audiencePages = [
  { label: 'Buying or selling', short: 'Buyers & sellers', href: '/buyers-sellers' },
  { label: 'Real estate agents', short: 'Real estate agents', href: '/agents' },
  { label: 'Lenders & loan officers', short: 'Lenders & loan officers', href: '/lenders' },
  { label: 'Investors & specialty work', short: 'Investors & specialty', href: '/investors' },
];
