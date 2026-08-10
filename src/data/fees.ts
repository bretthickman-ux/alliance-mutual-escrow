/* Fee schedule (HANDOFF section 5), verified against Fees_Flyer_AME_8_2025.pdf.
   Structured so the same numbers drive the mockup fee tables now and the real
   tiered calculator in Phase 2. One source of truth: no fee is typed twice. */

export const fees = {
  /** Sale escrow, each side: base + per-thousand of sale price. The rate drops
      past two million (verified against Fees_Flyer_AME_8_2025.pdf, HANDOFF
      section 5 rev 2026-08-10). */
  sale: {
    base: 300,
    perThousand: 2.15,
    /** Rate on the portion of the price above the breakpoint. */
    perThousandOverBreak: 1.75,
    breakpoint: 2_000_000,
    label: '$300 + $2.15/K',
    labelOverBreak: '$300 + $2.15/K to $2M, then $1.75/K',
    /** Buyer add-on, published. */
    loanProcessing: 500,
  },

  /** Owner-supplied line, approved for visitor copy (Review Board round 2). */
  conciergeNote: 'Our concierge service often covers the cost of the notary.',

  /** Labeled estimates, never billed as-is; third parties set the final number.
      The owner cut notary from the homepage example; it stays out of calculator
      defaults (accurate defaults await Laura's closing cost sheet). */
  estimates: {
    notaryWithLoan: 250,
  },

  /** SFR refinance, flat tiers by loan amount. `max: null` means "quoted". */
  sfrRefinance: {
    tiers: [
      { upTo: 750_000, flat: 650, label: 'Up to $750,000' },
      { upTo: 1_000_000, flat: 850, label: '$750,001 to $1,000,000' },
      { upTo: 2_000_000, flat: 1_200, label: '$1,000,001 to $2,000,000' },
      { upTo: null as number | null, flat: null as number | null, label: 'Over $2,000,000' },
    ],
    processing: 200,
  },

  /** Multi-family and commercial refinance. */
  commercialRefinance: {
    base: 95,
    perThousand: 0.95,
    minLoan: 500_000,
    label: '$95 + $0.95/K',
  },

  /** Seller add-ons, named per the fee sheet. */
  sellerAddOns: [
    { key: 'demand', label: 'Demand processing, per payoff', amount: 30 },
    { key: 'grantDeed', label: 'Grant deed processing', amount: 50 },
    { key: 'taxForm', label: 'Tax form processing', amount: 50 },
    { key: 'archive', label: 'Archive fee', amount: 50 },
    { key: 'hoa', label: 'HOA processing, per association', amount: 50 },
  ],

  /** Other published add-ons. */
  addOns: [
    { key: '1031', label: '1031 processing', amount: 250 },
    { key: 'subordination', label: 'Subordination agreement', amount: 50 },
    { key: 'solar', label: 'Solar transfer, per side', amount: 100 },
    { key: 'docPrep', label: 'Doc prep (POA, interspousal, additional deed), each', amount: 50 },
    { key: 'payoffBill', label: 'Payoff of bills, each', amount: 10 },
    { key: 'heloc', label: 'HELOC or second-only escrow', amount: 250 },
  ],
} as const;

/** Sale escrow fee for one side: $2.15/K to the breakpoint, $1.75/K past it. */
export function saleFee(price: number): number {
  const { base, perThousand, perThousandOverBreak, breakpoint } = fees.sale;
  const below = Math.min(price, breakpoint);
  const above = Math.max(0, price - breakpoint);
  return Math.round(base + (below / 1000) * perThousand + (above / 1000) * perThousandOverBreak);
}

/** Formula label for display; switches when the price crosses the breakpoint. */
export function saleFeeLabel(price: number): string {
  return price > fees.sale.breakpoint ? fees.sale.labelOverBreak : fees.sale.label;
}

/** SFR refinance flat fee for a loan amount, or null when it must be quoted. */
export function sfrRefinanceFee(loan: number): number | null {
  const tier = fees.sfrRefinance.tiers.find((t) => t.upTo === null || loan <= t.upTo);
  return tier ? tier.flat : null;
}

/** Multi-family / commercial refinance fee (loan floored to the minimum). */
export function commercialRefinanceFee(loan: number): number {
  const effective = Math.max(loan, fees.commercialRefinance.minLoan);
  return Math.round(fees.commercialRefinance.base + (effective / 1000) * fees.commercialRefinance.perThousand);
}

/** Currency formatter used across fee UI. */
export function usd(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}
